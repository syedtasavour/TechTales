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
.get(verifyJWT, isBlogOwner, togglePublishStatus)
.patch(verifyJWT, isBlogOwner, updateBlog)
.delete(verifyJWT, isBlogOwner, deleteBlog);
// ------------------------------------------------------------

export default router;
