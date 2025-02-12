// Import cloudinary, file system, and path modules
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Configure cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY, // Your Cloudinary API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Your Cloudinary API secret
});

// Async function to upload a file to Cloudinary and remove the local file afterward
const uploadOnCloudinary = async (localFilePath) => {
  try {
    // Return null if there is no file path provided
    if (!localFilePath) return null;

    // Upload the file to Cloudinary under the "blog" folder with auto resource type detection
    const response = await cloudinary.uploader.upload(localFilePath, {
      // resource_type: "auto",
      folder: "blog",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    });

    // Delete the local file after successful upload
    fs.unlinkSync(localFilePath);

    // Return the Cloudinary response object
    return response;
  } catch (error) {
    // If an error occurs, remove the local file to clean up and return null
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const destroyImageOnCloudinary = async (image) => {
  try {
    if (!image) return null;
    let updatedImage = path.basename(image, path.extname(image));
    // console.log(updatedImage);

    const response = await cloudinary.uploader.destroy(`blog/${updatedImage}`);
    // console.log(response);
    return response;
  } catch (error) {
    return error;
  }
};

// const deleteAllImages  = async (req, res) => {
//   cloudinary.api
//     .delete_all_resources({type: 'upload'})
//     .then(result=>console.log(result));
// };

// deleteAllImages()

export { uploadOnCloudinary, destroyImageOnCloudinary };
