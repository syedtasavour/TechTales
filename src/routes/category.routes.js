import {Router} from "express"
const router = Router()
import { createCategory } from "../controllers/category.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"









router.route("/").post( verifyJWT,
upload.single("image"),createCategory);



export default router