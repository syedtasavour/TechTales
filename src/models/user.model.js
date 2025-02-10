import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
/**
 * @typedef {Object} UserSchema
 * @property {string} fullName - The full name of the user (required)
 * @property {string} username - Unique username for the user (required)
 * @property {string} email - Unique email address of the user (required)
 * @property {number} number - Unique contact number of the user (required)
 * @property {string} password - User's password (required)
 * @property {string} refreshToken - Token used for authentication refresh
 * @property {string} avatar - Cloudinary URL for user's profile picture (required)
 * @property {string} coverImage - Cloudinary URL for user's cover image
 * @property {Date} createdAt - Timestamp of when the document was created
 * @property {Date} updatedAt - Timestamp of when the document was last updated
 */
const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    number: {
      type: Number,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is Required"],
    },
    refreshToken: {
      type: String,
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
    coverImage: {
      type: String, //Cloudinary
    },
    role: {
      type: String,
      enum: ["admin", "author" ,"reader"],
      default: "reader",
    },
  },
  { timestamps: true }
);

// middleware function that runs before saving a user
// hashes the password if it has been modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 8);
  next();
});

// method to check if provided password matches hashed password in database
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// method to generate JWT access token containing user details
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACESS_TOKEN_EXPIRY,
    }
  );
};

// method to generate JWT refresh token containing user ID
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// add pagination plugin to schema
userSchema.plugin(mongooseAggregatePaginate);
// create and export User model
export const User = mongoose.model("User", userSchema);
