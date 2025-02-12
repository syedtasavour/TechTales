import { Router } from "express";
import { blogComment, deleteComment, getBlogComments, getUserAllComments, getUserPendingComments,getUserRejectedComments, updateComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isCommentOwner } from "../middlewares/isOwner.middleware.js";
const router = Router()

router.route("/:permalink").post(verifyJWT,blogComment).get(getBlogComments)
router.route("/:commentId").delete(verifyJWT,isCommentOwner,deleteComment).patch(verifyJWT,isCommentOwner,updateComment)

router.route("/").get(verifyJWT,getUserAllComments)
router.route("/user/pending").get(verifyJWT,getUserPendingComments)
router.route("/user/rejected").get(verifyJWT,getUserRejectedComments)

export default router;