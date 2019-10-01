const mongoose = require("mongoose");

const { Schema, model } = mongoose;

//Reference: These NodeJS and Mongoose code is learned from online tutorial CodewithMosh
//https://codewithmosh.com/courses/enrolled/293204
const postSchema = new Schema(
  {
    title: { type: String, required: true },
    images_url: [{ type: String, required: true }],
    topics: {
      type: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
      select: false
    }
  },
  { timestamps: { createdAt: "created_at" } }
);

const Post = mongoose.model("Post", postSchema);

exports.Post = Post;
