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
  blogData.title = title;
  blogData.content = content;
  if (tags) blogData.tags = tags;
  if (isPublished) blogData.isPublished = isPublished;
  blogData.permalink = permalink;
  if (uploadedFeatureImage)
    blogData.featureImage = uploadedFeatureImage.secure_url;
  if (uploadedContentImageUrls.length > 0)
    blogData.contentImages = uploadedContentImageUrls;
  if (req.user?._id) blogData.author = req.user._id;

  const blog = await Blog.create(blogData);
  const author = await User.findById(req.user._id);
  if (author.role === "reader") {
    await User.updateOne({ role: "author" });
  }
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
  if (!title && !content && !tags && !isPublished && !rawPermalink) {
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
  blogData.status = "pending";
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

const getUserPrivateBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const blogsAggregate = Blog.aggregate([
    {
      $match: {
        author: new mongoose.Types.ObjectId(req.user._id),
        isPublished: false,
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
    .json(
      new ApiResponse(200, blogs, "User private blogs retrieved successfully.")
    );
});

const getUserPendingBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const blogsAggregate = Blog.aggregate([
    {
      $match: {
        author: new mongoose.Types.ObjectId(req.user._id),
        status: "pending",
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
    .json(
      new ApiResponse(200, blogs, "User pending blogs retrieved successfully.")
    );
});

const getUserApprovedBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const blogsAggregate = Blog.aggregate([
    {
      $match: {
        author: new mongoose.Types.ObjectId(req.user._id),
        status: "approved",
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
    .json(
      new ApiResponse(200, blogs, "User approved blogs retrieved successfully.")
    );
});

const getUserRejectedBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const blogsAggregate = Blog.aggregate([
    {
      $match: {
        author: new mongoose.Types.ObjectId(req.user._id),
        status: "rejected",
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
    .json(
      new ApiResponse(200, blogs, "User rejected blogs retrieved successfully.")
    );
});

const getUserPublicBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const blogsAggregate = Blog.aggregate([
    {
      $match: {
        author: new mongoose.Types.ObjectId(req.user._id),
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
    .json(
      new ApiResponse(200, blogs, "User public blogs retrieved successfully.")
    );
});

const toggleApprovalStatus = asyncHandler(async (req, res) => {
  const { permalink, status } = req.body;
  // Change the approved button's name to "Approve" and set its value to "Approved"
  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    throw new ApiError(
      400,
      `Invalid status provided ${status}. Only pending, approved, or rejected values are allowed`
    );
  }
  if (!permalink) {
    throw new ApiError(
      400,
      "Permalink is required to update the approval status of the post."
    );
  }

  const blog = await Blog.findOneAndUpdate(
    {
      permalink: permalink,
    },
    {
      $set: { status },
    },
    {
      new: true,
      runValidators: true,
    }
  );
  return res
    .status(201)
    .json(
      new ApiResponse(201, blog, "Blog approval status updated successfully.")
    );
});

const getUserLiveBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const blogsAggregate = Blog.aggregate([
    {
      $match: {
        author: new mongoose.Types.ObjectId(req.user._id),
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
    .json(
      new ApiResponse(200, blogs, "User live blogs retrieved successfully.")
    );
});

const fetchBlogByPermalink = asyncHandler(async (req, res) => {
  const { permalink } = req.params;
  if (!permalink) {
    throw new ApiError(
      404,
      "Permalink parameter is missing. Please provide a valid permalink in the URL."
    );
  }

  const blog = await Blog.aggregate([
    {
      $match: {
        permalink: permalink,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author",
        pipeline: [
          {
            $project: {
              fullName: 1,
              avatar: 1,
              _id: 0,
            },
          },
        ],
      },
    },
    { $unwind: "$author" },
    {
      $project: {
        _id: 1,
        permalink: 1,
        title: 1,
        content: 1,
        featureImage: 1,
        contentImages: 1,
        views: 1,
        author: 1,
        createdAt: 1,
      },
    },
  ]);
  console.log("====================================");
  console.log(blog);
  console.log("====================================");
  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  await Blog.findByIdAndUpdate(
    blog[0]._id,
    {
      $inc: { views: 1 },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, blog[0], "Blog retrieved successfully!"));
});



export {
  createBlog,
  togglePublishStatus,
  updateBlog,
  deleteBlog,
  getUserAllPublicBlogs,
  toggleApprovalStatus,
  getUserPrivateBlogs,
  getUserPendingBlogs,
  getUserApprovedBlogs,
  getUserRejectedBlogs,
  getUserPublicBlogs,
  getUserLiveBlogs,
  fetchBlogByPermalink,
};
