import {Router} from "express";
import { searchBlog } from "../controllers/search.controller.js";
const router = Router()




//  author dashboard Routes
router.route("/").get(searchBlog);




export default router;