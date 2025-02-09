import express from "express"
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
import userRouter from "./routes/user.routes.js"
import blogRouter from "./routes/blog.routes.js"



//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/blogs", blogRouter)

export {app}