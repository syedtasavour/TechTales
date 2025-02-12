import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Blog } from "../models/blog.models.js";
import { Comment } from "../models/comment.model.js";

const likeBlog = asyncHandler(async (req, res) => {
  const { permalink } = req.params;
  const blog = await Blog.findOne({ permalink: permalink });
  const liked = await Like.aggregate([
    {
      $match: {
        blog: new mongoose.Types.ObjectId(blog._id),
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
  ]);
  if (liked.length > 0) {
    const like = await Like.findByIdAndDelete(liked[0]._id);
    return res
      .status(200)
      .json(new ApiResponse(200, like, "Blog like removed successfully"));
  }
  const like = await Like.create({
    blog: blog._id,
    blogAuthor: blog.author,
    likedBy: req.user._id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, like, "Blog liked successfully"));
});

const totalAuthorLikes = asyncHandler(async (req, res) => {
  const totalLikes = await Like.aggregate([
    {
      $match: {
        blogAuthor: new mongoose.Types.ObjectId(req.user._id),
      },
    },{
        $count: "authorTotalLikes", // Counts the number of matching documents
      },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, totalLikes[0], "Total likes fetched successfully"));
});

const likeComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findById(id)
  // const blog = await Blog.findOne({ permalink: permalink });
  const liked = await Like.aggregate([
    {
      $match: {
        comment: new mongoose.Types.ObjectId(comment._id),
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
  ]);
  if (liked.length > 0) {
    const like = await Like.findByIdAndDelete(liked[0]._id);
    return res
      .status(200)
      .json(new ApiResponse(200, like, "Comment like removed successfully"));
  }
  const like = await Like.create({
    comment: comment._id,
    likedBy: req.user._id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, like, "Comment liked successfully"));
});



export { likeBlog, totalAuthorLikes,likeComment };
