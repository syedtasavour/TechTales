import {Router} from "express";
const router = Router()

import { toggleApprovalStatus } from "../controllers/blog.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";



router.route("/blogs/status").post(verifyJWT, isAdmin, toggleApprovalStatus);


export default router