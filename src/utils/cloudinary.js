import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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
const getPublicId = (url) => {
  const parts = url.split("/");
  const publicId = parts[parts.length - 1].split(".")[0];
  return publicId;
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    console.log(res.result);
    if (res.result !== "ok")
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  } catch (error) {
    console.log("failed to delete the file from cloudinary", error);
  }
};
export { uploadOnCloudinary, getPublicId, deleteFromCloudinary };
