const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");

//Reference: These NodeJS and Mongoose code is learned from online tutorial CodewithMosh
//https://codewithmosh.com/courses/enrolled/293204

const {
  User,
  validateRegisterUser,
  validateLoginUser
} = require("../model/userModel");
const jwt = require("jsonwebtoken");
const config = require("../config.json");

router.get("/", async (req, res) => {
  const users = await User.find();
  if (!users) return res.status(404).json({ users: "none" });
  return res.status(200).json(users);
});

const spm = require("../middleware/socketPuppetManager");

//login
router.post(
  "/login",
  async (req, res) => {
    // data format is not correct
    const { error } = validateLoginUser(req.body);
    if (error) res.status(400).send(error.details[0].message);

    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("invalid email"); //user doesn't exist

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(400).send("invalid password"); //password is wrong

    // user didn't activate
    // if (!user.is_active)
    //   return res.status(400).send("user has not been activated");

    const token = user.generateUserJwtToken();
    const _id = user._id;
    const is_admin = user.is_admin;

    return res.status(200).send({ token, _id, is_admin }); //status for {token}
  },
  spm
);

//register users
router.post("/register", async (req, res) => {
  //validate user data if error then return error message
  const { error } = validateRegisterUser(req.body);
  if (error) res.status(400).send(error.details[0].message);

  //to check if the email has been registered
  const result = await User.findOne({ email: req.body.email }); //result will be the whole document that you find
  if (result) return res.status(400).send("the email has already been used");

  const username = await User.findOne({ username: req.body.username }); //result will be the whole document that you find
  if (username)
    return res.status(400).send("the username has already been used");

  //hash user password
  const user = new User(_.pick(req.body, ["username", "email", "password"]));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  //save user to db if error then return error message
  await user.save();

  //send verification link to this email
  const jwtToken = user.generateEmailJwtToken();
  user.sendVerificationEmail(jwtToken);

  //return user info
  return res.status(201).send(_.pick(user, ["username", "email"]));
});

router.get("/verify_email/:userId/:token", async (req, res) => {
  const user = jwt.verify(req.params.token, config.key);
  await User.update(
    { _id: user._id },
    {
      $set: {
        is_active: true
      }
    }
  );
  return res.redirect("http://localhost:3000/signin");
});

//to send a reset password email to user
router.post("/forget_password/send_email", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).send("email does not exist");
  const token = user.generateEmailJwtToken();
  user.sendForgetPasswordEmail(token);
  return res.status(201).send(_.pick(user, ["username", "email"]));
});

// when user click the link in the email redirect user to reset password page
router.get(
  "/forget_password/reset_password/:userID/:token",
  async (req, res) => {
    const user = await jwt.verify(req.params.token, config.key);
    // redirect user to reset password page

    return res.redirect(
      `http://localhost:3000/reset-password/${req.params.userID}`
    );
  }
);

// reset user password when user submit their new password
router.post("/forget_password/update_password", async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(req.body.password, salt);

  await User.update(
    { _id: req.body.userId },
    {
      $set: {
        password: password
      }
    },
    { new: true }
  );
  res.status(200).send("update succeed");
});

module.exports = router;
