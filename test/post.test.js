const request = require("supertest");
const { Post } = require("../model/postModel");
let server = require("../index");

describe("/post", () => {
  beforeEach(() => {
    server = require("../index");
  });
  afterEach(async () => {
    server.close();
    await Post.remove({});
  });

  describe("GET /", () => {
    it("should return all posts", async () => {
      const posts = [{ title: "new" }];
      await Post.collection.insertMany(posts);
      const res = await request(server).get("/post");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });
});
