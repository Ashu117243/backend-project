// require("dotenv").config({path:'./env'})

import express from "express";

import connectDB from "./db/index.js";

import dotenv from "dotenv";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(` server has started at PORT : ${process.env.PORT}`);
    });
    app.on("ERROR", (err) => {
      console.log("There is an error in start of the server ", err);
    });
  })
  .catch((err) => {
    console.log("MongoDb connection ERROR !!! ", err);
  });

/*
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    app.on("ERROR", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      (console, log("app is listening on PORT: ".process.env.PORT));
    });
  } catch (error) {
    console.error("ERROR: ", error);
    throw error;
  }
})();
*/
