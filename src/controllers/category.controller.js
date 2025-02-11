import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import slugify from "slugify";
import fs from "fs";
import { Category } from "../models/category.model.js";
import mongoose from "mongoose";
import { Blog } from "../models/blog.models.js";

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, permalink: rawPermalink } = req.body;

  if ([name, description].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  let permalink = null;
  // If the frontend does not provide a permalink, auto-generate it from the category name using slugify.

  if (!rawPermalink || rawPermalink.trim() === "") {
    permalink = slugify(name, { lower: true, strict: true });
  } else {
    permalink = slugify(rawPermalink, { lower: true, strict: true });
  }

  const existedCategory = await Category.findOne({
    $or: [{ name: name }, { permalink: permalink }],
  });

  if (existedCategory) {
    // Remove uploaded files to clean up
    fs.unlinkSync(req.file.path);
    throw new ApiError(
      409,
      "A category with the specified name or permalink already exists. Please choose different values."
    );
  }
  const image = await uploadOnCloudinary(req.file?.path);
  if (!image) {
    throw new ApiError(
      500,
      "Something went wrong while uploading the file. Please check the format or if the image is allowed. Try again later."
    );
  }

  const category = await Category.create({
    name: name,
    description: description,
    image: image.secure_url,
    permalink: permalink,
    author: req.user._id,
  });

  if (!category) {
    throw new ApiError(500, "Something went wrong while creating the category");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, permalink: rawPermalink } = req.body;
  if (!name && !description && !rawPermalink) {
    throw new ApiError(400, "At least one field is required");
  }

  let permalink = "";
  if (rawPermalink) {
    permalink = slugify(rawPermalink, { lower: true, strict: true });
  }
  const existingCategory = await Category.find({
    $or: [{ name: name }, { permalink: permalink }],
  });

  if (existingCategory) {
    throw new ApiError(
      409,
      "Permalink and name must be unique; duplicate not allowed."
    );
  }

  // Prepare the fields to update in the Category
  const updateFields = {};
  updateFields.status = "pending";
  if (name) updateFields.name = name;
  if (description) updateFields.description = description;
  if (permalink) updateFields.permalink = permalink;

  const updatedCategory = await Category.findByIdAndUpdate(
    req.category,
    {
      $set: updateFields,
    },
    {
      new: true,
    }
  );
  if (!updateCategory) {
    throw new ApiError(
      500,
      "Something went wrong while updating the category in the database"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedCategory, "Category updated successfully")
    );
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.category);
  if (!category) {
    throw new ApiError(
      500,
      "Something went wrong while deleting the category in the database"
    );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category successfully deleted"));
});
const toggleCategoryApproval = asyncHandler(async (req, res) => {
  const { name, status } = req.body;
  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    throw new ApiError(
      400,
      `Invalid status provided ${status}. Only pending, approved, or rejected values are allowed`
    );
  }
  if (!name) {
    throw new ApiError(
      400,
      "name is required to update the approval status of the post."
    );
  }
  const category = await Category.findOneAndUpdate(
    {
      name: name,
    },
    {
      $set: { status: status },
    },
    {
      new: true,
    }
  );
  if (!category) {
    throw new ApiError(
      500,
      "Failed to update the category status. Please try again later."
    );
  }
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        category,
        "Category status has been updated successfully."
      )
    );
});
const updateCategoryImage = asyncHandler(async (req, res) => {
  const { name } = req.params;
  if (!req.file.path) {
    throw new ApiError(
      400,
      "Image file is required to update the category image."
    );
  }
  const image = await uploadOnCloudinary(req.file.path);
  if (!image) {
    throw new ApiError(500, "Something went wrong while uploading the image.");
  }

  const category = await Category.findOneAndUpdate(
    {
      name: name,
    },
    {
      image: image.secure_url,
      status: "pending",
    },
    {
      new: true,
    }
  );
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        category,
        "Category status has been updated successfully."
      )
    );
});
const getCategory = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const category = await Category.aggregate([
    {
      $match: {
        name: name,
      },
    },
  ]);

  if (!category) {
    throw new ApiError(
      404,
      "Category not found. Please check the category name and try again."
    );
  }
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        category,
        "Category status has been updated successfully."
      )
    );
});
const getApprovedCategory = asyncHandler(async (req, res) => {
  const category = await Category.aggregate([
    {
      $match: {
        status: "approved",
      },
    },
  ]);

  if (!category) {
    throw new ApiError(404, "Category not found. Please try again.");
  }
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        category,
        "Category status has been updated successfully."
      )
    );
});

const getPendingCategory = asyncHandler(async (req, res) => {
  const category = await Category.aggregate([
    {
      $match: {
        status: "pending",
      },
    },
  ]);
  if (!category) {
    throw new ApiError(404, "Category not found. Please try again.");
  }
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        category,
        "Category status has been updated successfully."
      )
    );
});
const getRejectedCategory = asyncHandler(async (req, res) => {
  const category = await Category.aggregate([
    {
      $match: {
        status: "rejected",
        author: mongoose.Types.ObjectId(req.user._id),
      },
    },
  ]);
  if (!category) {
    throw new ApiError(404, "Category not found. Please try again.");
  }
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        category,
        "Category status has been updated successfully."
      )
    );
});

const getAllRejectedCategory = asyncHandler(async (req, res) => {
  const category = await Category.aggregate([
    {
      $match: {
        status: "rejected",
      },
    },
  ]);
  if (!category) {
    throw new ApiError(404, "Category not found. Please try again.");
  }
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        category,
        "Category status has been updated successfully."
      )
    );
});

const fetchBlogsByCategory = asyncHandler(async (req, res) => {
  const { category: rawCategory, page = 1, limit = 10 } = req.query;
  // const category = req.query.category
  const category = await Category.findOne({ name: rawCategory });
  const blogsAggregate = Blog.aggregate([
    {
      $match: {
        category: new mongoose.Types.ObjectId(category._id),
        status: "approved",
        isPublished: true,
      },
    },
    {
      $lookup: {
        from: "categories", // Ensure correct collection name
        localField: "category",
        foreignField: "_id",
        as: "category",
        pipeline: [
          {
            $project: {
              name: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users", // Ensure correct collection name
        localField: "author",
        foreignField: "_id",
        as: "author",
        pipeline: [
          {
            $project: {
              fullName: 1,
            },
          },
        ],
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },

    // {
    //   $project: {

    //     category: 1,
    //     author: 1,
    //   },
    // },
  ]);

  const options = {
    page,
    limit,
  };

  const blogs = await Blog.aggregatePaginate(blogsAggregate, options);
  return res
    .status(200)
    .json(
      new ApiResponse(200, blogs.docs, "public blogs retrieved successfully.")
    );
});

export {
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryApproval,
  updateCategoryImage,
  getCategory,
  getApprovedCategory,
  getPendingCategory,
  getRejectedCategory,
  getAllRejectedCategory,
  fetchBlogsByCategory,
};
