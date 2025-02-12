import { ApiError } from "../utils/ApiError.js";
import { Blog } from "../models/blog.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";
import { Comment } from "../models/comment.model.js";

const isBlogOwner = asyncHandler(async (req, _, next) => {
  const { permalink } = req.params;

  const blog = await Blog.findOne({ permalink: permalink });
  if (!blog) {
    throw new ApiError(
      404,
      "Blog not found - please check the provided permalink."
    );
  }
  if (req.user.role === "admin") {
    req.blog = blog._id;

    return next();
  }
  if (req.user._id.toString() !== blog.author.toString()) {
    throw new ApiError(
      403,
      "Forbidden: Only the blog owner can change the blog status."
    );
  }

  req.blog = blog._id;
  req.blog_data = blog;
  next();
});
const isAuthor = asyncHandler(async (req, _, next) => {
  if (req.user.role !== "author" && req.user.role !== "admin") {
    throw new ApiError(
      401,
      "Unauthorized: This path is reserved exclusively for the author."
    );
  }
  next();
});

const isCategoryOwner = asyncHandler(async (req, _, next) => {
  const { permalink } = req.params;
  const category = await Category.findOne({ permalink: permalink });
  if (!category) {
    throw new ApiError(
      404,
      "category not found - please check the provided name."
    );
  }
  if (req.user.role === "admin") {
    req.category = category._id;

    return next();
  }

  if (req.user._id.toString() !== category.author._id.toString()) {
    throw new ApiError(
      401,
      "Unauthorized: Only the category owner can access this resource."
    );
  }
  req.category = category._id;
  next();
});
const isCommentOwner = asyncHandler(async (req, _, next) => {
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(
      404,
      "Comment not found - please check the provided id."
    );
  }
  if (req.user.role === "admin") {
    return next();
  }

  if (req.user._id.toString() !== comment.commentBy._id.toString()) {
    throw new ApiError(
      401,
      "Unauthorized: Only the category owner can access this resource."
    );
  }
  next();
});

export { isBlogOwner, isCategoryOwner, isAuthor, isCommentOwner };
