import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

// we are trying to verify if user is logged in or not
//
export const jwtVerify = asyncHandler(async (req, res, next) => {
  try {
    // we are checking both cookies and header in case token is not present in cookies
    const token =
      (await req.cookies?.accessToken) ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "unauthorized request");
    }

    // we are doing this to verify token and get the playload from it that we sent while generating token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // we got the userid from decoded token now we will fetch the user from database
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "invalid Access Token");
    }
    // if we get the user send it in req ;
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(400, error);
  }
});
