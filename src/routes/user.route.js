import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  UpdatePassword,
  updateUserInfo,
  updateUserAvatar,
  updateUserCoverImage,
  getChannelProfileInfo,
  getUsersWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),

  registerUser
);

router.route("/login").post(loginUser);

//secure routes

router.route("/logout").post(jwtVerify, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/update-password").post(jwtVerify, UpdatePassword);
router.route("/update-user-info").patch(jwtVerify, updateUserInfo);
router
  .route("/avatar")
  .patch(jwtVerify, upload.single("avatar"), updateUserAvatar);
router
  .route("/coverimage")
  .patch(jwtVerify, upload.single("coverImage"), updateUserCoverImage);
router.route("/channel/:username").get(jwtVerify, getChannelProfileInfo);
router.route("/history").get(jwtVerify, getUsersWatchHistory);

export default router;
