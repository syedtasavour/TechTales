import { Blog } from "../models/blog.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import slugify from "slugify"

// createBlog creates a new blog post with proper image uploads and slugified permalink.
// It validates the request body, processes images, and stores the blog post in the database.
const createBlog = asyncHandler(async (req, res) => {
    const { title, content, tags, isPublished, permalink: rawPermalink } = req.body;

    if (!title || !content || !isPublished) {
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

    const featureImagePath = req.files.featureImage ? req.files.featureImage[0].path : null;
    if (!featureImagePath) {
        throw new ApiError(400, null, "Feature image file is required");
    }
    const contentImagePaths = req.files.contentImages ? req.files.contentImages.map((file) => file.path) : [];
    console.log(contentImagePaths);

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
    if (uploadedFeatureImage) blogData.featureImage = uploadedFeatureImage.secure_url;
    if (uploadedContentImageUrls.length > 0) blogData.contentImages = uploadedContentImageUrls;
    if (req.user?._id) blogData.author = req.user._id;

    const blog = await Blog.create(blogData);

    return res.status(201).json(new ApiResponse(201, blog, "Blog post created successfully!"));
});



export {createBlog}
