import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { Aggregate } from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    // Find user by ID
    const user = await User.findById(userId);
    // Generate refresh token
    const refreshToken = user.generateRefreshToken();
    // Generate access token
    const accessToken = user.generateAccessToken();
    // Assign refresh token to user
    user.refreshToken = refreshToken;
    // Save user without validation
    await user.save({ validateBeforeSave: false });
    // Return both tokens
    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // Get user details from request body
  const { fullName, username, email, number, password } = req.body;

  // Check if any required field is empty
  if (
    [fullName, username, email, number, password].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check in database if user already exists
  const existedUser = await User.find({
    $or: [{ username }, { email }, { number }],
  });
  if (existedUser.length > 0) {
    // Remove uploaded files to clean up
    fs.unlinkSync(req.files.avatar[0].path);
    if (req.files?.coverImage?.[0]?.path)
      fs.unlinkSync(req.files.coverImage[0].path);
    throw new ApiError(409,"user with email or username already exists");
  }

  // Capture file paths for avatar and cover image
  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // Upload avatar and cover image to cloud storage
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400,  "Avatar file upload failed");
  }

  // Create a new user record in the database
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    number,
    password,
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || "",
  });

  // Retrieve created user without sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken "
  );
  if (!createdUser) {
    throw new ApiError(
      500,
      
      "Something went wrong while registering the user"
    );
  }

  // Return response with created user data
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered sucessfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Extract required fields from request body
  const { email, number, password } = req.body;

  // Check if password or email is missing
  if (!(password || email)) {
    throw new ApiError(400, "Username or Email Is Required");
  }

  // Find user by email or phone number
  const user = await User.findOne({
    $or: [{ number }, { email }],
  });

  // Throw error if user not found
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Validate password
  const isPasswordValid = await user.isPasswordCorrect(password);
  // Throw error if password invalid
  if (!isPasswordValid) {
    throw new ApiError(401, "Enter Correct Password");
  }

  // Generate new tokens
  const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(user._id);

  // Retrieve user data without sensitive fields
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  // Set cookies for tokens
  const options = { httpOnly: true, secure: true };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Logged In Successfully"
      )
    );
});

// Remove user's refresh token and return success on logout
const logoutUser = asyncHandler(async (req, res) => {
  // Step 1: Unset refresh token for the user
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });

  // Step 2: Define cookie options
  const options = { httpOnly: true, secure: true };

  // Step 3: Clear cookies and send response
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiError(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookies or body
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  try {
    // Verify token with secret
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Find user from token data
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Ensure token matches user's stored token
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user._id);

    // Set cookie options
    const options = { httpOnly: true, secure: true };

    // Return new tokens to client
    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        201,
        { accessToken, refreshToken: newRefreshToken },
        "Access token refreshed"
      );
  } catch (error) {
    // Catch token errors
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// Define passwordChange function wrapped in asyncHandler for error handling
const passwordChange = asyncHandler(async (req, res) => {
  // Extract oldPassword, newPassword, and confirmPassword from request body
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Find user by ID from the request object
  const user = await User.findById(req.user?._id);
  // If user is not found, throw a 404 error
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Check if newPassword and confirmPassword are the same
  if (newPassword !== confirmPassword) {
    throw new ApiError(401,  "New password and confirm password must be same");
  }

  // Verify that the old password is correct using user's method
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  // If the old password does not match, throw a 401 error
  if (!isPasswordValid) {
    throw new ApiError(401,  "Enter Correct Password");
  }

  // Update user's password with the new one
  user.password = newPassword;
  // Save the updated user without running validations
  user.save({ validateBeforeSave: false });

  // Send a response indicating the password change was successful
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Password changed successfully"));
});


// fetch the currently logged-in user's details
const getCurrentUser = asyncHandler(async (req, res) => {
  // Return a success response with the user data
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User details retrieved successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  // Extract account details from the request body
  const { fullName, username, email, number } = req.body;

  // Validate that all required fields are provided
  if (!fullName || !username || !email || !number) {
    // If any field is missing, throw an error indicating that all fields are required
    throw new ApiError(400, "All fields are required");
  }

  // Prepare the fields to update in the user's account
  const updateFields = {};
  if (fullName) updateFields.fullName = fullName;
  if (username) updateFields.username = username;
  if (email) updateFields.email = email;
  if (number) updateFields.number = number;

  // Update the user's information in the database and return the updated record
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,                // The user's ID from the request object
    { $set: updateFields },      // The update operation, setting the new values
    { new: true }                // Option to return the updated document
  ).select("-password");         // Exclude the password for security

  // Respond with a success message and the updated user details
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // Extract the local path of the uploaded avatar file
  const avatarLocalPath = req.file?.path;
  
  // Ensure an avatar file is provided
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // Upload the avatar image to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // Confirm that the upload was successful
  if (!avatar) {
    throw new ApiError(500,  "Failed to upload the avatar image. Please try again later.");
  }

  // Update the user's avatar URL in the database and return the updated document
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { avatar: avatar.secure_url },
    { new: true }
  ).select("-password -refreshToken");

  // Respond with a success status and the updated user information
  return res
    .status(202)
    .json(new ApiResponse(202, updatedUser, "User avatar has been updated successfully"));
});


const updateCoverImage = asyncHandler(async (req, res) => {
  // Extract the local path of the uploaded cover image file
  const coverImageLocalPath = req.file?.path;
  
  // Ensure a cover image file is provided
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  // Upload the cover image to Cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // Confirm that the upload was successful
  if (!coverImage) {
    throw new ApiError(500,  "Failed to upload the cover image. Please try again later.");
  }

  // Update the user's cover image URL in the database and return the updated document
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { coverImage: coverImage.secure_url },
    { new: true }
  ).select("-password -refreshToken");

  // Respond with a success status and the updated user information
  return res
    .status(202)
    .json(new ApiResponse(202, updatedUser, "User cover image has been updated successfully"));
});

// const authorPage = asyncHandler(async(req,res)=>{
//   const { username } = req.params;

//   if (!username?.trim) {
//     throw new ApiError(401, "username is missing");
//   }

//   const author = await User.aggregate([
//     {
//       $match:{ owner: username?.toLowerCase(),
//     },},
//     {
//       $lookup:{
//         from: "blogs",
//         localField: "owner",
//         foreignField: "_id",
//         as: "blogs"
        
//       },
//     },
//     {
//       $project: {
//         fullName: 1,
//         username: 1,
//         subscribersCount: 1,
//         channelsSubscribedToCount:1,
//         isSubscribed: 1,
//         avatar: 1,
//         coverImage: 1,
//         email: 1,
//       },
//     },
//   ])
// })


export { registerUser,loginUser,logoutUser,refreshAccessToken,passwordChange,getCurrentUser,updateAccountDetails,updateCoverImage,updateUserAvatar };
