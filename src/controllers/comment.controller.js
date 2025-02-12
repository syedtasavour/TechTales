import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Blog } from "../models/blog.models.js";

// In the future, we will add an image feature. For now, text only.
const blogComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content cannot be empty.");
  }
  const blog = await Blog.findOne({ permalink: req.params.permalink });
  if (!blog) {
    throw new ApiError(
      400,
      "Blog not found. Please verify that the provided permalink is correct."
    );
  }
  const comment = await Comment.create({
    blog: blog._id,
    commentBy: req.user._id,
    content: content,
  });
  if (!comment) {
    throw new ApiError(
      500,
      "An error occurred while adding your comment. Please try again later."
    );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, comment, "Your comment has been added successfully!")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  const response = await Comment.findByIdAndDelete(req.params.commentId);
  if (!response) {
    throw new ApiError(
      400,
      "Comment not found. Please verify that the provided permalink is correct."
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, response, "Comment has been deleted successfully.")
    );
});

const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content cannot be empty.");
  }
  const comment = await Comment.findByIdAndUpdate(req.params.commentId, {
    content: content,
  });
  if (!comment) {
    throw new ApiError(
      400,
      "Comment not found. Please verify that the provided permalink is correct."
    );
  }
  const updatedComment = await Comment.findById(comment._id);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedComment,
        "Comment has been updated successfully."
      )
    );
});

const getBlogComments = asyncHandler(async (req, res) => {
  const { permalink, page = 1, limit = 10 } = req.params;
  const blog = await Blog.findOne({ permalink: permalink });
  if (!blog) {
    throw new ApiError(
      400,
      "Blog not found. Please verify that the provided permalink is correct."
    );
  }
  const commentAggregate = Comment.aggregate([
    {
      $match: {
        blog: new mongoose.Types.ObjectId(blog._id),
        status: "approved",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "commentBy",
        foreignField: "_id",
        as: "commentedBy",
        pipeline: [
          {
            $project: {
              fullName: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$commentedBy" },
  ]);

  const options = {
    page: page,
    limit: limit,
  };

  const comments = await Comment.aggregatePaginate(commentAggregate, options);
  if (!comments) {
    throw new ApiError(
      500,
      "Unable to fetch comments for the blog. Please try again later."
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, comments, "Blog comments retrieved successfully.")
    );
});

const getUserAllComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.params;
  const commentAggregate = Comment.aggregate([
    {
      $match: {
        commentBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "commentBy",
        foreignField: "_id",
        as: "commentedBy",
        pipeline: [
          {
            $project: {
              fullName: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$commentedBy" },
  ]);

  const options = {
    page: page,
    limit: limit,
  };

  const comments = await Comment.aggregatePaginate(commentAggregate, options);
  if (!comments) {
    throw new ApiError(
      500,
      "Unable to fetch comments for the blog. Please try again later."
    );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "comments retrieved successfully."));
});
const getUserPendingComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.params;
  const commentAggregate = Comment.aggregate([
    {
      $match: {
        commentBy: new mongoose.Types.ObjectId(req.user._id),
        status: "pending",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "commentBy",
        foreignField: "_id",
        as: "commentedBy",
        pipeline: [
          {
            $project: {
              fullName: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$commentedBy" },
  ]);

  const options = {
    page: page,
    limit: limit,
  };

  const comments = await Comment.aggregatePaginate(commentAggregate, options);
  if (!comments) {
    throw new ApiError(
      500,
      "Unable to fetch comments for the blog. Please try again later."
    );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "comments retrieved successfully."));
});
const getUserRejectedComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.params;
  const commentAggregate = Comment.aggregate([
    {
      $match: {
        commentBy: new mongoose.Types.ObjectId(req.user._id),
        status: "rejected",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "commentBy",
        foreignField: "_id",
        as: "commentedBy",
        pipeline: [
          {
            $project: {
              fullName: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$commentedBy" },
  ]);

  const options = {
    page: page,
    limit: limit,
  };

  const comments = await Comment.aggregatePaginate(commentAggregate, options);
  if (!comments) {
    throw new ApiError(
      500,
      "Unable to fetch comments for the blog. Please try again later."
    );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "comments retrieved successfully."));
});

const getAllComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.params;

  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    throw new ApiError(
      400,
      `Invalid status provided ${status}. Only pending, approved, or rejected values are allowed`
    );
  }

  const commentAggregate = Comment.aggregate([
    {
      $match: {
        commentBy: new mongoose.Types.ObjectId(req.user._id),
        status: status,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "commentBy",
        foreignField: "_id",
        as: "commentedBy",
        pipeline: [
          {
            $project: {
              fullName: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$commentedBy" },
  ]);

  const options = {
    page: page,
    limit: limit,
  };

  const comments = await Comment.aggregatePaginate(commentAggregate, options);
  if (!comments) {
    throw new ApiError(
      500,
      "Unable to fetch comments for the blog. Please try again later."
    );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "comments retrieved successfully."));
});
const toggleCommentApprovalStatus = asyncHandler(async (req, res) => {
  const { status, commentId } = req.body;

  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    throw new ApiError(
      400,
      `Invalid status provided ${status}. Only pending, approved, or rejected values are allowed`
    );
  }
  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { status: status },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, comment, "comments status updated successfully.")
    );
});
export {
  blogComment,
  deleteComment,
  updateComment,
  getBlogComments,
  getUserAllComments,
  getUserPendingComments,
  getUserRejectedComments,
  getAllComments,toggleCommentApprovalStatus
};
