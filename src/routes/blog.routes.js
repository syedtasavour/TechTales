import { Router } from "express";
const router = Router()

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { isBlogOwner } from "../middlewares/isOwner.middleware.js";

import {
  createBlog,
  deleteBlog,
  togglePublishStatus,
  updateBlog,
  fetchBlogByPermalink,
  fetchAllPublicBlogs,updateBlogFeatureImage,updateBlogContentImage
} from "../controllers/blog.controller.js";
import { fetchBlogsByCategory } from "../controllers/category.controller.js";


router.route("/?category/").get(fetchBlogsByCategory)
router.route("/").post(
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
).get(fetchAllPublicBlogs);
router
.route("/:permalink")
.get(fetchBlogByPermalink)
.patch(verifyJWT, isBlogOwner, updateBlog)
.delete(verifyJWT, isBlogOwner, deleteBlog);

router.route("/feature-image/:permalink").patch(verifyJWT,isBlogOwner,upload.single("featureImage"),updateBlogFeatureImage)
router.route("/content-image/:permalink").patch(verifyJWT,isBlogOwner,upload.fields([
  {
    name: "contentImages",
    maxCount: 10,
  }
]),updateBlogContentImage)
router.route("/status/:permalink").get(verifyJWT, isBlogOwner, togglePublishStatus)
// ------------------------------------------------------------

export default router;
