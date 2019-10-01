const { Post } = require("../model/postModel");
const Comment = require("../model/commentModel");

//Reference: These NodeJS and Mongoose code is learned from online tutorial CodewithMosh
//https://codewithmosh.com/courses/enrolled/293204
class PostCtl {
  async checkPostExist(req, res, next) {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ post: "post not exist" });
    next();
  }

  async checkIsUserMatch(req, res, next) {
    const post = await Post.findById(req.params.id);

    if (
      post.post_owner.toString() !== req.user._id &&
      req.user.is_admin === false
    )
      return res.status(403).json({ error: "Unauthorized User" });

    next();
  }

  async find(req, res, next) {
    const { per_page = 10 } = req.query;
    const page = Math.round(Math.max(req.query.page * 1, 1)) - 1;
    //为了字符串转数字，所以*1
    const perPage = Math.round(Math.max(per_page * 1, 1));
    const posts = await Post.find({ title: new RegExp(req.query.title) })
      .limit(perPage)
      .skip(page * perPage)
      .populate("post_owner");
    // .select({ username: 1 });
    return res.status(200).json(posts);
  }

  async findById(req, res, next) {
    const { fields = "" } = req.query;
    const selectFields = fields
      .split(";")
      .filter(f => f)
      .map(f => " +" + f)
      .join("");
    const post = await Post.findById(req.params.id)
      .select(selectFields)
      .populate("post_owner");
    if (post) return res.status(200).json(post);
    return res.status(404).json({ result: "post not exist" });
  }

  async create(req, res, next) {
    const postInfo = {
      title: req.body.title,
      post_owner: req.user._id,
      //post_owner: req.body.post_owner,
      images_url: req.body.images_url,
      topics: req.body.topics
    };
    const post = await new Post(postInfo).save();
    if (post) return res.status(200).json(post);
  }

  async update(req, res, next) {
    const oldPost = await Post.findByIdAndUpdate(req.params.id, req.body);
    if (oldPost)
      //更新前得topic
      return res.status(200).json(oldPost);
  }

  async deleteOnePost(req, res, next) {
    // see if this post has comment
    const comments = await Comment.find({
      postId: req.params.id
    });
    let has_image = null;
    let has_emoji = null;
    if (!comments || comments.length === 0) {
      //no comments
      await Post.deleteOne({ _id: req.params.id });
      return res.status(200).json({ result: "delete succeeded" });
    } else {
      // have comments
      let i;
      for (i = 0; i < comments.length; i++) {
        if (comments[i].images_url.length > 0) {
          // has image response
          has_image = true;
          break;
        } else if (comments[i].emojiString.length > 0) {
          // has emojis
          has_emoji = true;
        }
      }
      if (has_image) {
        await Post.update(
          { _id: req.params.id },
          {
            $set: {
              images_url: []
            }
          }
        );
        return res.status(205).json({ result: "replace images" });
      } else if (has_emoji) {
        await Post.deleteOne({ _id: req.params.id });
        return res.status(200).json({ result: "delete succeeded" });
      }
    }
  }
}

module.exports = new PostCtl();
