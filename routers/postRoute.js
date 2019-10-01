const express = require("express");
const router = express.Router();
const {
  find,
  findById,
  create,
  update,
  checkPostExist,
  checkIsUserMatch,
  deleteOnePost
} = require("../controller/post");
const authUser = require("../middleware/authUser");

//Reference: These NodeJS and Mongoose code is learned from online tutorial CodewithMosh
//https://codewithmosh.com/courses/enrolled/293204
router.get("/", find);
router.post("/", authUser, create);
router.get("/:id", findById);
router.patch("/:id", authUser, checkPostExist, checkIsUserMatch, update);
router.delete(
  "/:id",
  authUser,
  checkPostExist,
  checkIsUserMatch,
  deleteOnePost
);

module.exports = router;
