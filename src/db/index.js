import mongoose from "mongoose"
import { DB_NAME } from "../constants.js";
/**
 * Connects to MongoDB using the configured connection URI.
 *
 * Steps:
 *  1. Retrieve the MongoDB URI and DB name from environment variables.
 *  2. Attempt to establish a connection to the MongoDB database.
 *  3. On success, log the connection host information.
 *  4. On failure, log the error and exit the process.
 *
 * @async
 * @function connectDb
 * @returns {Promise<void>} Resolves when the connection is successful or exits the process on failure.
 */
const connectDb = async () => {
    try {
      const connectionInstance = await mongoose.connect(
        `${process.env.MONGODB_URI}/${DB_NAME}`
      );
      console.log(`MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
      console.log("MONGODB Connection Error", error);
      process.exit(1);
    }
  };
  
  export default connectDb