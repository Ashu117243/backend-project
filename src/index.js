// require("dotenv").config({path:'./env'})

import connectDB from "./db/index.js";

import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    
    app.on("ERROR", (err) => {
      console.log("There is an error in start of the server ", err);
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(` server has started at PORT : ${process.env.PORT}`);
    });
    
  })
  .catch((err) => {
    console.log("MongoDb connection ERROR !!! ", err);
  });

//importing

/* use a semicolon before starting an IFFE 
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
