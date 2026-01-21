import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    // we are adding refresh token to our user in database
    user.refreshToken = refreshToken;
    // now we save the user
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error in generating access and refresh token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get the data from frontend

  const { fullname, email, username, password } = req.body;
  console.log(fullname);

  // validte if everything is there
  if (
    [fullname, email, username, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "EveryFiled is Required");
  }

  // check if user already exists or not
  const exists = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (exists) {
    throw new ApiError(409, "this username or email already exist");
  }

  // take loaclpath of Avatar and coverImage from multer
  const avatarLocalFilePath = req.files?.avatar?.[0]?.path;

  // const coverImageLocalFilePath = req.files?.coverImage?.[0]?.path;
  let coverImageLocalFilePath;
  // check if coverImage is present
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalFilePath = req.files.coverImage[0].path;
  }

  //validate Avatar
  if (!avatarLocalFilePath) {
    throw new ApiError(400, "upload the Avatar");
  }

  // upload Avatar and coverImage on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalFilePath);
  const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);

  // validate avatar
  if (!avatar) {
    throw new ApiError(400, "upload the Avatar");
  }

  // create User
  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "Not avilable",
    email,
    password,
  });

  // remove password and refresh token from response
  const createUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  // check if the user is created or not
  if (!createUser) {
    throw new ApiError(500, "Coudnot create User");
  }

  // return the user noww
  return res
    .status(201)
    .json(new ApiResponse(200, createUser, "user created Succesfully"));
});

// login user controller

const loginUser = asyncHandler(async (req, res) => {
  // take username or email and password from fronted

  const username = req.body?.username?.toLowerCase();
  const email = req.body?.email?.toLowerCase();
  const password = req.body?.password;

  // validate username or password

  if (!username && !email) {
    throw new ApiError(400, "username or email required");
  }
  // find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  // validate the user
  if (!user) {
    throw new ApiError(409, "user not found please register");
  }

  if (!password) {
    throw new ApiError(400, "enter ur password");
  }

  try {
    await user.isPasswordCorrect(password);
  } catch (error) {
    throw new ApiError(400, "please check your username or password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // we use this httponly ans secure to make sure that cookies can only be modified by the server
  const options = {
    httpOnly: true,
    secure: true,
  };

  // we can use the cuurent user without db call too if we do not want another  db call
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          // if user wants to save access and refresh token locally or developing mobile then there we can't use cookies so we send them in response body
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User succesfully logged In"
      )
    );
});

// logout user controller

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      // because we are logging out so we remove refresh token from database
      $set: {
        refreshToken: undefined,
      },
    },
    {
      // we get new updated user after this saving we get new user returned by this method
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged Out"));
});

// refresh the accessToken when it is expired

const refreshAccessToken = asyncHandler(async (req, res) => {
  // we are taking refresh token from inside the cookies or if not present there then from re.body
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  // checking if the refreshtoken avilabel
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request no refresh token");
  }
  try {
    //  verifying refreshtoken to get user info and userId because we sent it when we generated refreshtoken
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // findind user based on the userid that we got from decoding the token
    const user = await User.findById(decodedToken?._id);

    // checking if we got user or not
    if (!user) {
      throw new ApiError(400, " 3 , invalid refresh Token");
    }

    // condition if token from cookies  and token from database match or not if not then error
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(400, "4 , Invalid refresh Token");
    }

    // if both refresh token match generate new access and refreshToken
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    // set options for cookies
    const options = {
      httpOnly: true,
      secure: true,
    };

    // send the response
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "accessToken refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(400, "request denied  not a valid refresh token");
  }
});

// Update the userpasswrod

const UpdatePassword = asyncHandler(async (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    throw new ApiError(400, "Both password fields are required");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "password does not match");
  }

  const user = await User.findById(req?.user._id);
  if (!user) {
    throw new ApiError(400, "User  not found");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

// update UserInfo
const updateUserInfo = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname && !email) {
    throw new ApiError(400, "Fullname or email is requred");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(400, "user Info not updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "userInfo updated successfully"));
});

// update user Avatar

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLocalFilePath = req.files?.coverImage?.[0]?.path;
  if (!CoverImageLocalFilePath) {
    throw new ApiError(400, "cover image not avilavle");
  }
  const user = await User.findById(req.user._id);

  const coverImage = await uploadOnCloudinary(CoverImageLocalFilePath);

  user.coverImage = coverImage.url;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, coverImage, "coverImage updated successfully"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  // i have to delete the old avatar file after uploading i will write it in the end
  const avatarLocalFilePath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalFilePath) {
    throw new ApiError(400, "avatar image not avilavle");
  }
  const user = await User.findById(req.user._id);

  const avatar = await uploadOnCloudinary(avatarLocalFilePath);

  user.avatar = avatar.url;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, avatar, "avatar image updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  UpdatePassword,
  updateUserInfo,
  updateUserAvatar,
  updateUserCoverImage,
};
