import { Request, Response } from "express";
import { IGetUserInterfaceRequst } from "../../@types/custom";
import { CategoryModel } from "../models/category.model";
import { delete_cloudinary, upload_cloudinary } from "../utils/cloudinary";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { removeLocalFiles } from "../utils/necessaryFunc";
import { FileModel, IFile } from "../models/file.model";

import { v2 as cloudinary } from "cloudinary";
import { MulterFile } from "./project.controllers";
import { Readable } from "stream";
import { io } from "..";

const createCategory = async (req: IGetUserInterfaceRequst, res: Response) => {
  const title = req.body.title.trim();
  const file = req.file;

  const user = req.user;

  try {
    if (!title || !file)
      throw new ApiError(400, "Title and icon is required!");

    const isExist = await CategoryModel.findOne({ title });
    if (isExist) {
      throw new ApiError(409, "Category Already Exists!");
    }

    // upload icon
    const uploadedIcon = await uploadCategoryIcon(file) as any;

    // await upload_cloudinary(
    //   iconPath!,
    //   process.env.ICON_FOLDER!
    // );

    // icon save in DB

    const icon = await FileModel.create({
      public_id: uploadedIcon?.public_id,
      url: uploadedIcon?.secure_url,
    });

    const category = await CategoryModel.create({
      title: title,
      icon: icon._id,
      author: user?._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Category Created Successfuly!", category));
  } catch (error) {
    console.log({ error });
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res
        .status(500)
        .json(new ApiError(500, "Internal server error from create category!"));
    }
  }
};

const updateCategory = async (req: IGetUserInterfaceRequst, res: Response) => {
  const id = req.params.id;
  const title = req.body.title;
  const icon = req.file;

  try {
    if (!id) throw new ApiError(400, "Category id not found!");
    if (!title && !icon)
      throw new ApiError(400, "Title or icon is required!");

    const category = await CategoryModel.findOne({ _id: id }).populate("icon");

    if (!category) {
      throw new ApiError(404, "Category not found!");
    }

    //<----------------grab old icon data-------------------->
    const oldICon = category.icon as IFile;

    //<----------------update Icon if avaiable-------------------->

    if (icon) {
      //<----------------upload new icon to cludinary-------------------->
      const newIcon = await uploadCategoryIcon(icon) as any;
      //<----------------replace in DB with old icon file-------------------->
      if (newIcon) {
        await FileModel.updateOne(
          { _id: category.icon._id },
          { $set: { public_id: newIcon!.public_id, url: newIcon.secure_url } }
        );

        //<----------------delete old image from cloudinary-------------------->
        await delete_cloudinary(oldICon.public_id);

      } else {
        throw new ApiError(403, "icon upload failed");
      }
    }

    //<----------------updata title-------------------->
    category.title = title;
    const updatedCategory = (await category.save()).populate("icon");

    return res.status(201).json(
      new ApiResponse(201, "Category Created Successfuly!", {
        ...updatedCategory,
      })
    );
  } catch (error) {
    console.log({error})
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(error);
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res
        .status(500)
        .json(new ApiError(500, "Internal server error from create category!"));
    }
  }
};

const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await CategoryModel.find()
      .populate("icon")
      .populate("author", "-password -refreshToken");
    if (!categories)
      return res.status(404).json(new ApiError(404, "Category Not Found!"));

    const returnData = categories.map((category) => (category as any)._doc);
    return res
      .status(200)
      .json(new ApiResponse(200, "category founded!", returnData));
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error in get category section",
      ok: false,
    });
  }
};

const getCategory = async (req: Request, res: Response) => {
  const categoryId = req.params.id;

  try {
    const category = await CategoryModel.findById(categoryId)
      .populate("icon")
      .populate("author", "-password -refreshToken");
    if (!category)
      return res.status(404).json(new ApiError(404, "Category not Found!"));

    const returnData = {
      ...(category as any)._doc,
    };
    return res
      .status(200)
      .json(new ApiResponse(200, "Category Founded!", { ...returnData }));
  } catch (error) {
    // instance of ApiError
    // validationError
    // castError
    // DuplicateKeyError 11000 | 11001
    // interval error

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(error);
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res
        .status(500)
        .json(new ApiError(500, "Internal server error from login user!"));
    }
  }
};

const deleteCategory = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    //<---------------- id missin response -------------------->
    if (!id) throw new ApiError(400, "Category id not found!");

    //<----------------find category-------------------->
    const category = await CategoryModel.findById(id).populate("icon");

    if (!category) throw new ApiError(400, "Category not found!");

    //<---------------- get icon-------------------->
    const icon = category.icon as IFile;

    //<----------------now delete category-------------------->
    const deleted = await CategoryModel.deleteOne({ _id: id });

    //<----------------if delete then delete the icon-------------------->
    if (!deleted.deletedCount)
      throw new ApiError(403, "Failed to delete category!");

    await FileModel.deleteOne({ _id: icon._id });

    //<----------------delete icon from cloudinary-------------------->
    await delete_cloudinary(icon.public_id);

    //<----------------delet completed-------------------->
    return res.status(200).json({ message: "Category delete successfull!" });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(error.message);
    } else {
      return res.status(error.statusCode | 500).json(error.message);
    }
  }
};

const uploadCategoryIcon = async (file: MulterFile) => {
  let writeBytes = 0;
  const fileSize = file.size;

  return new Promise((resolve, reject) => {
    const upload_stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.ICON_FOLDER!,
        resource_type: "image",
        context: {
          file_name: file.originalname,
        },
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    const read_stream = new Readable();

    const chunk_size = 200;
    for (let i = 0; i < file.buffer.length; i += chunk_size) {
      const chunk = file.buffer.subarray(i, i + chunk_size);
      read_stream.push(chunk);
    }

    read_stream.push(null);

    read_stream.on("data", (chunk) => {
      writeBytes += chunk.length;
      const progress = Math.floor((writeBytes / fileSize) * 100);

      io.emit("category-icon-upload-progress", progress);
    });

    read_stream.pipe(upload_stream);
  });
};

export {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
