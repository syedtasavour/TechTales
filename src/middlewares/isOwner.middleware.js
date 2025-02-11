import { ApiError } from "../utils/ApiError.js";
import { Blog } from "../models/blog.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

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
    console.log(req.user.role);
    
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

export { isBlogOwner };
