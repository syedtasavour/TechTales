import {Router} from "express";
const router = Router()

import { toggleApprovalStatus } from "../controllers/blog.controller.js";
import { getAllRejectedCategory, toggleCategoryApproval } from "../controllers/category.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";
import { getAllComments, toggleCommentApprovalStatus } from "../controllers/comment.controller.js";



router.route("/rejected").get(verifyJWT,isAdmin,getAllRejectedCategory)
router.route("/blogs/status").post(verifyJWT, isAdmin, toggleApprovalStatus);
router.route("/category/status").post(verifyJWT, isAdmin, toggleCategoryApproval);
router.route("/comments/:status").get(verifyJWT, isAdmin, getAllComments).patch(toggleCommentApprovalStatus);

export default router