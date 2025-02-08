/**
 * @file index.js
 * @description Initializes server setup: loads environment variables, connects to the database,
 * and starts the application server.
 *
 * @step 1 - Load environment configurations using dotenv from "../.env".
 * @step 2 - Connect to the database with connectDb(); handle promise resolution.
 * @step 3 - If the connection is successful, attach an error event listener to log and throw server errors.
 * @step 4 - Start the server to listen on the port defined in process.env.PORT, or fallback to port 8000.
 * @step 5 - If the database connection fails, catch the error and log a failure message.
 */
import dotenv from "dotenv"
import connectDb from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "../.env",
});
connectDb()
  .then(() => {
    app.on("error", (error) => {
      console.log("error", error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO DB connection failed !!!", err);
  });