import {Router} from "express";
const router = Router()
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getUserPrivateBlogs,
    getUserApprovedBlogs,
    getUserPublicBlogs,
    getUserPendingBlogs,
    getUserRejectedBlogs,
    getUserLiveBlogs } from "../controllers/blog.controller.js";
import { isBlogOwner } from "../middlewares/isOwner.middleware.js";


//  author dashboard Routes
router.route("/private").get(verifyJWT, getUserPrivateBlogs);
router.route("/public").get(verifyJWT, getUserPublicBlogs);
router.route("/live").get(verifyJWT, getUserLiveBlogs);
router.route("/approved").get(verifyJWT, getUserApprovedBlogs);
router.route("/pending").get(verifyJWT, getUserPendingBlogs);
router.route("/rejected").get(verifyJWT, getUserRejectedBlogs);
// router.route("/author").get(verifyJWT,getUserAllPublicBlogs);



export default router;