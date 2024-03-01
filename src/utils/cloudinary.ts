import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from "cloudinary";
import fs from "fs";
import env from "dotenv";
import mongoose from "mongoose";
import { IImage } from "../models/image.model";
import { FileModel, IFile } from "../models/file.model";
import { IProject } from "../models/project.model";
import { IUserPopulate } from "../models/user.model";
import { ApiError } from "./apiError";
env.config();

 export const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

cloudinary.config(cloudinaryConfig)
const upload_cloudinary = async (
  filePath: string,
  folderPath: string,
  resource_type: "image" | "video" | "raw" | "auto" | undefined = "image",
  count = 0
) => {
  try {
    const uploaded: UploadApiResponse = await cloudinary.uploader.upload(
      filePath,
      {
        folder: folderPath,
        resource_type,
      },
      (err, result) => {
        if (err) {
          //retry
          if (count < 3)
            return upload_cloudinary(
              filePath,
              folderPath,
              resource_type,
              count + 1
            );

          console.log({ erOfCloudinaryr: err });
          return new ApiError(400, "failed to upload image to cloudinary!");
        } else return result;
      }
    );
    if (fs.existsSync(filePath!)) {
      fs.unlinkSync(filePath!);
    }
    return uploaded;
  } catch (error) {
    if (fs.existsSync(filePath!)) {
      fs.unlinkSync(filePath!);
    }
    return null;
  }
};

const upload_file_cloudinary = async (
  filePath: string,
  folderPath: string,
  resource_type: "image" | "video" | "raw" | "auto" | undefined = "image"
) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      { resource_type: resource_type, folder: folderPath },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
};

const uploadToCloudinaryAndDB = async (
  Model: mongoose.Model<IFile | IUserPopulate>,
  filePath: string,
  folder: string,
  resource_type: "auto" | "image" | "video" | "raw" | undefined = "raw"
) => {
  // upload to cloudinary
  const cloud = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: resource_type,
  });
  const document = new Model({
    url: cloud.secure_url,
    public_id: cloud.public_id,
  });
  await document.save();
  return document._id;
};

const delete_cloudinary = async (public_id: string) => {
  try {
    const deleteInstance = await cloudinary.uploader.destroy(
      public_id,
      (error, result) => {
        if (error) {
          throw new ApiError(400, "failed to delete image from cloudinary!");
        }
        return result;
      }
    );
    return deleteInstance;
  } catch (error) {
    return null;
  }
};

const delete_file_cludinary = async (public_id: string) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(public_id, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};
export {
  upload_cloudinary,
  delete_cloudinary,
  upload_file_cloudinary,
  delete_file_cludinary,
  uploadToCloudinaryAndDB,
};
