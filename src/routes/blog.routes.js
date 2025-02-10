import { Router } from "express";

const router = Router();

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { isBlogOwner } from "../middlewares/isOwner.middleware.js";

import {
  createBlog,
  deleteBlog,
  getUserPrivateBlogs,
  getUserAllPublicBlogs,
  toggleApprovalStatus,
  togglePublishStatus,
  updateBlog,
  getUserApprovedBlogs,
  getUserPublicBlogs,
  getUserPendingBlogs,
  getUserRejectedBlogs,
  getUserLiveBlogs,
} from "../controllers/blog.controller.js";

//  dashboard Routes
router.route("/private").get(verifyJWT, getUserPrivateBlogs);
router.route("/public").get(verifyJWT, getUserPublicBlogs);
router.route("/live").get(verifyJWT, getUserLiveBlogs);
router.route("/approved").get(verifyJWT, getUserApprovedBlogs);
router.route("/pending").get(verifyJWT, getUserPendingBlogs);
router.route("/rejected").get(verifyJWT, getUserRejectedBlogs);

// router.route("/approved/").get(verifyJWT,getUserApprovedBlogs);

router.route("/pending/").post(toggleApprovalStatus);
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

router.route("/author/").get(getUserAllPublicBlogs);
router
  .route("/:permalink")
  .get(verifyJWT, isBlogOwner, togglePublishStatus)
  .patch(verifyJWT, isBlogOwner, updateBlog)
  .delete(verifyJWT, isBlogOwner, deleteBlog);
// ------------------------------------------------------------

export default router;
