import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { upload } from "../middlewares/multer.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get the data from frontend

  const { fullname, email, username, password } = req.body;

  // validte if everything is there
  if (
    [fullname, email, username, password].some((field) => field?.trim() == "")
  ) {
    throw new ApiError(400, "EveryFiled is Required");
  }
  // check if user already exists or not
  const exists = User.findOne({
    $or: [{ username }, { email }],
  });
  if (exists) {
    throw new ApiError(409, "this username or email already exist");
  }

  // take loaclpath of Avatar and coverImage from multer
  const AvatarLocalFilePath = req.files?.Avatar[0]?.path;
  const coverImageLocalFilePath = req.files?.coverImage[0]?.path;

  //validate Avatar
  if (!AvatarLocalFilePath) {
    throw new ApiError(400, "upload the Avatar");
  }

  // upload Avatar and coverImage on cloudinary
  const Avatar = await uploadOnCloudinary(AvatarLocalFilePath);
  const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);

  // validate avatar
  if (!Avatar) {
    throw new ApiError(400, "upload the Avatar");
  }

  // create User
  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    Avatar: Avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
  });

  // remove password and refresh token from user
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

export { registerUser };
