const express = require("express");
const mongoose = require("mongoose");
const post = require("./routers/postRoute");

const app = express();
app.use("/post", post);

mongoose
  .connect(`mongodb://localhost/test`)
  .then(() => console.log("connected to db..."))
  .catch(err => console.log(err));

const port = 3030;
const server = app.listen(port, () =>
  console.log(`listening to port:${port}...`)
);

module.exports = server;
