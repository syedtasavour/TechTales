import { Router } from "express";
const router = Router();
import { createCategory, deleteCategory, getCategory, updateCategory, updateCategoryImage,getApprovedCategory, getPendingCategory } from "../controllers/category.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isCategoryOwner,isAuthor } from "../middlewares/isOwner.middleware.js";



router.route("/").post(verifyJWT, upload.single("image"), createCategory).get(getApprovedCategory);
router.route("/pending").get(verifyJWT,isAuthor,getPendingCategory)
router.route("/rejected").get(verifyJWT,isAuthor,getPendingCategory)
router.route("/:permalink").patch(verifyJWT, isCategoryOwner,updateCategory).get(getCategory).delete(verifyJWT,isCategoryOwner,deleteCategory);
router.route("/image/:permalink").patch(verifyJWT,isCategoryOwner,upload.single("image"),updateCategoryImage)



export default router;
