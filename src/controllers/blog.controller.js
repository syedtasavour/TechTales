import { Blog } from "../models/blog.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import slugify from "slugify";
import fs from "fs";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
// createBlog creates a new blog post with proper image uploads and slugified permalink.
// It validates the request body, processes images, and stores the blog post in the database.
const createBlog = asyncHandler(async (req, res) => {
  const {
    title,
    content,
    tags,
    isPublished,
    permalink: rawPermalink,
  } = req.body;

  if (!title || !content || !isPublished) {
    req.files.featureImage.forEach((file) => {
      fs.unlinkSync(file.path); // Delete each uploaded image
    });
    req.files.contentImages.forEach((file) => {
      fs.unlinkSync(file.path); // Delete each uploaded image
    });
    throw new ApiError(400, "All fields are required");
  }

  // Process permalink using slugify on rawPermalink (if provided) or title.
  let permalink = rawPermalink
    ? slugify(rawPermalink, { lower: true, strict: true })
    : slugify(title, { lower: true, strict: true });

  let existingBlog = await Blog.findOne({ permalink });
  if (existingBlog) {
    permalink += `-${Date.now()}`;
  }

  const featureImagePath = req.files.featureImage
    ? req.files.featureImage[0].path
    : null;
  if (!featureImagePath) {
    req.files.contentImages.forEach((file) => {
      fs.unlinkSync(file.path); // Delete each uploaded image
    });
    throw new ApiError(400, "Feature image file is required");
  }
  const contentImagePaths = req.files.contentImages
    ? req.files.contentImages.map((file) => file.path)
    : [];

  const uploadedFeatureImage = await uploadOnCloudinary(featureImagePath);

  let uploadedContentImageUrls = [];
  for (const imagePath of contentImagePaths) {
    const uploadedImage = await uploadOnCloudinary(imagePath);
    uploadedContentImageUrls.push(uploadedImage.secure_url);
  }

  const blogData = {};
  if (title) blogData.title = title;
  if (content) blogData.content = content;
  if (tags) blogData.tags = tags;
  if (isPublished) blogData.isPublished = isPublished;
  if (permalink) blogData.permalink = permalink;
  if (uploadedFeatureImage)
    blogData.featureImage = uploadedFeatureImage.secure_url;
  if (uploadedContentImageUrls.length > 0)
    blogData.contentImages = uploadedContentImageUrls;
  if (req.user?._id) blogData.author = req.user._id;

  const blog = await Blog.create(blogData);

  return res
    .status(201)
    .json(new ApiResponse(201, blog, "Blog post created successfully!"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { isPublished } = req.body;

  if (isPublished !== true && isPublished !== false) {
    throw new ApiError(
      400,
      "Invalid isPublished value provided. Only published or draft are allowed."
    );
  }
  const blog = await Blog.findByIdAndUpdate(req.blog, {
    $set: {
      isPublished: isPublished,
    },
  });

  if (!blog) {
    throw new ApiError(500, null, "Something went wrong, please try again");
  }

  const response = await Blog.findById(req.blog);
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        response,
        "Blog publication status updated successfully!"
      )
    );
});

const updateBlog = asyncHandler(async (req, res) => {
  const {
    title,
    content,
    tags,
    isPublished,
    permalink: rawPermalink,
  } = req.body;
  if (!title  && !content  && !tags  && !isPublished && !rawPermalink) {
    throw new ApiError(400, "At least one field must be provided for update.");
  }

  let permalink = "";
  if (rawPermalink) {
    permalink = slugify(rawPermalink, { lower: true, strict: true });
  }
  let existingBlog = await Blog.findOne({ permalink: permalink });

  if (existingBlog) {
    throw new ApiError(
      409,
      "Permalink must be unique; duplicate permalink not allowed."
    );
  }

  const blogData = {};
  if (title) blogData.title = title;
  if (content) blogData.content = content;
  if (tags) blogData.tags = tags;
  if (isPublished) blogData.isPublished = isPublished;
  if (permalink) blogData.permalink = permalink;
  if (!blogData) {
    throw new ApiError(
      400,
      null,
      "At least one field must be provided for update."
    );
  }
  const blog = await Blog.findByIdAndUpdate(
    req.blog,
    {
      $set: blogData,
    },
    {
      new: true,
    }
  );

  if (!blog) {
    throw new ApiError(
      500,
      null,
      "Failed to update blog post. Please try again later."
    );
  }
  //   const updatedBlog = await Blog.findById(blog._id)
  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Blog post updated successfully!"));
});

const deleteBlog = asyncHandler(async (req, res) => {
const blog = await Blog.findByIdAndDelete(req.blog);
  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Blog has been successfully deleted"));
});

const getUserAllPublicBlogs = asyncHandler(async (req, res) => {
  const { author, page = 1, limit = 10 } = req.query;
  const user = await User.findOne({ username: author }).select("_id");
  if (!user || !user._id) {
    throw new ApiError(404, null, "No user found with the provided username.");
  }

  const blogsAggregate = Blog.aggregate([
    {
      $match: {
        author: new mongoose.Types.ObjectId(user),
        status: "approved",
        isPublished: true,
      },
    },
  ]);

  const options = {
    page,
    limit,
  };

  const blogs = await Blog.aggregatePaginate(blogsAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, blogs, "Blogs retrieved successfully."));
});

export {
  createBlog,
  togglePublishStatus,
  updateBlog,
  deleteBlog,
  getUserAllPublicBlogs,
};
