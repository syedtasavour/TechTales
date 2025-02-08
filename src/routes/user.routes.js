import { Router } from "express";
import {
  registerUser,loginUser,
  logoutUser,
  passwordChange,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage
} from "../controllers/user.controller.js";
/**
 * Initialize a new router instance.
 *
 * Step 1: Import the Router from Express.
 * Step 2: Create a new router instance.
 * Step 3: Use the router to define user-specific endpoints.
 * Step 4: Export the router for use in your application.
 *
 * @module user.routes
 */
const router = Router();

import { upload } from "../middlewares/multer.middleware.js";
import  {verifyJWT}  from "../middlewares/auth.middleware.js";

router.route("/register").post(upload.fields([{
  name: "avatar",
  maxCount: 1,
},
{
  name: "coverImage",
  maxCount: 1,
},]),registerUser)

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refresh-token").post(verifyJWT,logoutUser);
router.route("/change-password").post(verifyJWT, passwordChange)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/account").patch(verifyJWT,updateAccountDetails);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"),updateUserAvatar);
router.route("/cover-image").patch(verifyJWT, upload.single("cover-image"),updateCoverImage);

export default router;