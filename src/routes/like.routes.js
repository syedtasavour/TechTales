import { Router } from "express";
const router = Router();
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { likeBlog, totalAuthorLikes,likeComment, totalCommentLikes } from "../controllers/like.controller.js";



router.route("/comments").get(totalCommentLikes)
router.route("/:permalink").get(verifyJWT,likeBlog)
router.route("/comment/:id").get(verifyJWT,likeComment)
router.route("/").get(verifyJWT,totalAuthorLikes)


// export default router;
export default router;