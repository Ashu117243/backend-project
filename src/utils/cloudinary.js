import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { asyncHandler } from "./asyncHandler";
import { ApiError } from "./ApiError";
import { raw } from "express";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return "ERROR: file path not avilable";
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //  console.log("file is uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath);

    console.log("response from cloudinary", response.url);

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new ApiError(400, "cloudinary file path not avilavle");
    }
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto",
    });
    console.log(response);
    return response;
  } catch (error) {
    throw new ApiError(400, "cloudinary file path not avilavle");
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
