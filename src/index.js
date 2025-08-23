// require("dotenv").config({path:'./env'})

import express from "express";

import connectDB from "./db/index.js";

import dotenv from "dotenv";

dotenv.config({
  path: "./env",
});

connectDB();

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
