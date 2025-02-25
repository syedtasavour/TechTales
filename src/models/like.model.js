import mongoose, { Schema } from "mongoose";


const likeSchema = new Schema({
    blog: {
        type: Schema.Types.ObjectId,
        ref: "Blog",
        // required: true
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    blogAuthor: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
}, {timestamps: true})


export const Like = mongoose.model("Like", likeSchema)