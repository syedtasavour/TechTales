import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import slugify from "slugify";
import fs from "fs";
import { Category } from "../models/category.model.js";


const createCategory = asyncHandler(async (req, res) => {
  const { name, description, permalink } = req.body;
  console.log('====================================');
  console.log(req.body);
  console.log('====================================');

  if (
    [name, description].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // If the frontend does not provide a permalink, auto-generate it from the category name using slugify.
  if (!permalink || permalink.trim() === "") {
    req.body.permalink = slugify(name, { lower: true, strict: true });
  }

  const existedCategory = await Category.find({
    $or: [{ name }, { permalink }],
  });
  if (existedCategory.length > 0) {
    // Remove uploaded files to clean up
    fs.unlinkSync(req.files.image[0].path);
    throw new ApiError(
      409,
      "A category with the specified name or permalink already exists. Please choose different values."
    );
  }
  const image = await uploadOnCloudinary(req.file?.path);
  if(!image){
    throw new ApiError(
        500,
        "Something went wrong while uploading the file. Please check the format or if the image is allowed. Try again later."
    );
  }

  const category = await Category.create({
    name: name,
    description: description,
    image: image.secure_url,
    author: req.user._id,
  });
  console.log('====================================');
  console.log(category);
  console.log('====================================');
  if (!category) {
    throw new ApiError(
      500,
      null,
      "Something went wrong while creating the category"
    );
  }
return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

export {
    createCategory
}
