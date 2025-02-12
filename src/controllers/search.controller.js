import { Blog } from "../models/blog.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const searchBlog = asyncHandler(async (req, res) => {
  const query = req.query.q?.trim(); // Trim to avoid unnecessary spaces

  if (!query) {
    throw new ApiError(400, "Search query is required");
  }

  const results = await Blog.aggregate([
    {
      $match: {
        isPublished: true,
        status: "approved",
        $or: [
          { title: { $regex: query, $options: "i" } }, // Case-insensitive search
          { content: { $regex: query, $options: "i" } },
        ],
      },
    },
    { $sort: { createdAt: -1 } }, // Sorting by newest first
  ]);
  if (!results.length > 0) {
    return res.status(200).json(new ApiResponse(404, results, "No matching results found. Please try adjusting your search query."));
  }

return res.status(200).json(new ApiResponse(200, results, "Search results retrieved successfully"));
});

export { searchBlog };
