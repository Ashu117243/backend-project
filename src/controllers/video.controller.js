import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  getPublicId,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // only the published video
  const filter = { isPublished: true };
  // if there is any search word ;
  if (query) {
    filter.title = { $regex: query, $options: "i" };
  }
  // if wanna get video of a specific user
  if (userId) {
    filter.owner = userId;
  }
  // sorting logic
  const sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
  } else {
    sortOptions.createdAt = -1; // default newest first;
  }

  const videos = await Video.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNumber);

  const total = await Video.countDocuments(filter);

  return res
    .status(201)
    .json(new ApiResponse(201, "videos fetched successfully", videos));
});

const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video
  const { title, description } = req.body;

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "videoFile is not avilable");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail is not avilable");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(500, "Error while uploading video on cloudinary");
  }
  if (!thumbnail) {
    throw new ApiError(500, "Error while uploading thumbnail on cloudinary");
  }
  const owner = req.user;
  if (!owner) {
    throw new ApiError(400, "login before uploading the video");
  }
  const duration = Math.floor(videoFile.duration);
  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.playback_url,
    thumbnail: thumbnail.url,
    views: 0,
    duration: duration,
    isPublished: true,
    owner: owner._id,
  });

  if (!video) {
    throw new ApiError(500, "something went wrong while uploading the video");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, "video uploaded successfully", video));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const currVideo = await Video.findById(videoId);
  currVideo.views += 1;
  await currVideo.save({ validateBeforeSave: false });
  if (!currVideo) {
    throw new ApiError(404, "video not found");
  }
  if (!currVideo.isPublished) {
    throw new ApiError(500, "this video a private video");
  }
  res
    .status(201)
    .json(new ApiResponse(201, "video found successfully", currVideo));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const currVideo = await Video.findById(videoId);
  if (!currVideo) {
    throw new ApiError(404, "video not found");
  }
  const { title, description } = req.body;
  if (title) {
    currVideo.title = title;
  }
  if (description) {
    currVideo.description = description;
  }
  const thumbnailLocalPath = req?.files?.thumbnail[0]?.path;
  let thumbnail;
  if (thumbnailLocalPath) {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  }
  if (thumbnail) {
    currVideo.thumbnail = thumbnail.url;
  }

  await currVideo.save({ validateBeforeSave: false });

  return res
    .status(201)
    .json(new ApiResponse(201, "video updated successfully ", currVideo));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  const currVideo = await Video.findById(videoId);
  if (!currVideo) {
    throw new ApiError(400, "coudn't find the video");
  }
  console.log(currVideo);
  const id = getPublicId(currVideo.videoFile);
  if (!id) {
    throw new ApiError(400, "coudn't find the videoId");
  }
  deleteFromCloudinary(id);
  const resposne = await Video.deleteOne({ _id: currVideo._id });
  if (resposne.deletedCount === 1)
    return res
      .status(200)
      .json(new ApiResponse(200, "video deleted successfully"));
  else throw new ApiError(500, "coudn't delete the video");
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const currVideo = await Video.findById(videoId);
  if (!currVideo) {
    throw new ApiError(404, "video not found");
  }
  let isPublished = currVideo.isPublished;
  currVideo.isPublished = !isPublished;
  await currVideo.save({ validateBeforeSave: false });

  res
    .status(201)
    .json(
      new ApiResponse(201, "isPublished status changed", currVideo.isPublished)
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
