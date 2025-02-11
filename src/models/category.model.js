import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// const slugify = require("slugify");


const categorySchema = new Schema(
  {
    permalink: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      unique:true
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
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

categorySchema.plugin(mongooseAggregatePaginate);
export const Category = mongoose.model("Category", categorySchema);
