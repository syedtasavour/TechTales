import { Router } from "express";

const router = Router();

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";


import {createBlog}  from "../controllers/blog.controller.js";

router.route("/create").post(
  upload.fields([
    {
      name: "featureImage",
      maxCount: 1,
    },
    {
      name: "contentImages",
      maxCount: 10,
    },
  ]),verifyJWT,createBlog
);

export default router;
