import { Router } from "express";
const router = Router();

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { isBlogOwner } from "../middlewares/isOwner.middleware.js";

import {
  createBlog,
  deleteBlog,
  togglePublishStatus,
  updateBlog,
  fetchBlogByPermalink,
  fetchAllPublicBlogs,
  updateBlogFeatureImage,
  updateBlogContentImage,
  fetchUserAllLiveBlogs,
} from "../controllers/blog.controller.js";
import { fetchBlogsByCategory } from "../controllers/category.controller.js";

// Corrected route for fetching blogs by category
router.route("/category").get(fetchBlogsByCategory);

// Fixed post route for creating a blog
router
  .route("/")
  .post(
    verifyJWT,
    upload.fields([
      {
        name: "featureImage",
        maxCount: 1,
      },
      {
        name: "contentImages",
        maxCount: 10,
      },
    ]),
    createBlog
  )
  .get(fetchAllPublicBlogs);

// Fixed route for accessing a blog by permalink and performing actions like update and delete
router
  .route("/:permalink")
  .get(fetchBlogByPermalink)
  .patch(verifyJWT, isBlogOwner, updateBlog)
  .delete(verifyJWT, isBlogOwner, deleteBlog);

// Route for updating feature image
router
  .route("/feature-image/:permalink")
  .patch(verifyJWT, isBlogOwner, upload.single("featureImage"), updateBlogFeatureImage);

// Route for updating content images
router
  .route("/content-images/:permalink")
  .patch(
    verifyJWT,
    isBlogOwner,
    upload.fields([
      {
        name: "contentImages",
        maxCount: 10,
      },
    ]),
    updateBlogContentImage
  );

// Route for toggling publish status
router.route("/status/:permalink").get(verifyJWT, isBlogOwner, togglePublishStatus);

// Route for fetching live blogs by author
router.route("/author/public").get(fetchUserAllLiveBlogs);

export default router;
