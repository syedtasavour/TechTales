import { Router } from "express";
const router = Router();
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { likeBlog, totalAuthorLikes } from "../controllers/like.controller.js";



router.route("/:permalink").get(verifyJWT,likeBlog)
router.route("/").get(verifyJWT,totalAuthorLikes)


// export default router;
export default router;