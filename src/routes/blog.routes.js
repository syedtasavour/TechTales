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
  fetchBlogByPermalink
} from "../controllers/blog.controller.js";


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
);
router
.route("/:permalink")
.get(fetchBlogByPermalink)
.patch(verifyJWT, isBlogOwner, updateBlog)
.delete(verifyJWT, isBlogOwner, deleteBlog);

router.route("/status/:permalink").get(verifyJWT, isBlogOwner, togglePublishStatus)
// ------------------------------------------------------------

export default router;
