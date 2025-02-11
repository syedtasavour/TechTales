import { Router } from "express";
const router = Router();
import { createCategory, deleteCategory, getCategory, updateCategory, updateCategoryImage } from "../controllers/category.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isCategoryOwner } from "../middlewares/isOwner.middleware.js";



router.route("/").post(verifyJWT, upload.single("image"), createCategory);
router.route("/:name").patch(verifyJWT, isCategoryOwner,updateCategory).get(getCategory).delete(verifyJWT,isCategoryOwner,deleteCategory);
router.route("/image/:name").patch(verifyJWT,isCategoryOwner,upload.single("image"),updateCategoryImage)




export default router;
