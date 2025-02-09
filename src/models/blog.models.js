import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// const slugify = require("slugify");


const blogSchema = new Schema(
  {
    permalink: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    featureImage: {
      type: String,
      required: true,
    },
    contentImages: [
      {
        type: String,
      },
    ],
    tags: {
      type: String,
    },
    views: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// blogSchema.pre("save", function (next) {
//   if (!this.permalink) {
//     this.permalink = slugify(this.title, { lower: true, strict: true });
//   }
//   next();
// });

blogSchema.plugin(mongooseAggregatePaginate);
export const Blog = mongoose.model("Blog", blogSchema);
