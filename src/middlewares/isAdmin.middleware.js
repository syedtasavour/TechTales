import { ApiError } from "../utils/ApiError.js";
import { Blog } from "../models/blog.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const isAdmin = asyncHandler(async(req , res ,next)=>{
    const user = await User.findById(req.user._id)
    if(user.role != "admin"){
        throw new ApiError(401, null, "Only admin accounts can access this route. Unauthorized access is forbidden.")
    }
    next();
})