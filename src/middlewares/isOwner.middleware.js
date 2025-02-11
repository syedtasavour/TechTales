import { ApiError } from "../utils/ApiError.js";
import { Blog } from "../models/blog.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";

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
  next();
});

const isCategoryOwner = asyncHandler(async (req, _, next) => {
  const { name } = req.params;
  const category = await Category.findOne({ name: name });
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

export { isBlogOwner, isCategoryOwner };
