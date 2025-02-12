import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

/**
 * Express application instance.
 *
 * Steps:
 * 1. Create an instance of the Express application.
 * 2. Configure middleware and routes.
 * 3. Setup error handling and start the server.
 *
 * @type {import('express').Express}
 */
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.routes.js";
import blogRouter from "./routes/blog.routes.js";
import authorRouter from "./routes/author.routes.js";
import adminRouter from "./routes/admin.routes.js";
import categoryRoute from "./routes/category.routes.js";
import  likeRoute  from "./routes/like.routes.js";
import  commentRoute  from "./routes/comment.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/author", authorRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/like", likeRoute);
app.use("/api/v1/comment",commentRoute );

export { app };
