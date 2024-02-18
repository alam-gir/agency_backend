import { Request, Response } from "express";
import { IGetUserInterfaceRequst } from "../../@types/custom";
import { matchedData, validationResult } from "express-validator";
import { CategoryModel } from "../models/category.model";
import { delete_cloudinary, upload_cloudinary } from "../utils/cloudinary";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { removeLocalFiles } from "../utils/necessaryFunc";
import { FileModel, IFile } from "../models/file.model";

const createCategory = async (req: IGetUserInterfaceRequst, res: Response) => {
  const title = req.body.title.trim();
  const iconPath = req.file?.path;

  const user = req.user;
  try {
    if (!title || !iconPath)
      throw new ApiError(400, "Title and icon is required!");

    const isExist = await CategoryModel.findOne({ title });
    if (isExist) {
      throw new ApiError(409, "Category Already Exists!");
    }

    // upload icon
    const uploadedIcon = await upload_cloudinary(
      iconPath!,
      process.env.ICON_FOLDER!
    );

    // remove local file
    removeLocalFiles(iconPath);

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
const updateCategory = async (req: IGetUserInterfaceRequst, res: Response) => {
  const id = req.params.id;
  const title = req.body.title;
  const iconPath = req.file?.path;

  const user = req.user;

  try {
    if (!id) throw new ApiError(400, "Category id not found!");
    if (!title && !iconPath)
      throw new ApiError(400, "Title or icon is required!");

    const category = await CategoryModel.findOne({ _id: id }).populate("icon");

    if (!category) {
      throw new ApiError(404, "Category not found!");
    }

    //<----------------grab old icon data-------------------->
    const oldICon = category.icon as IFile;

    //<----------------update Icon if avaiable-------------------->

    if (iconPath) {
      //<----------------upload new icon to cludinary-------------------->
      const newIcon = await upload_cloudinary(
        iconPath,
        process.env.ICON_FOLDER!
      );

      //<----------------replace in DB with old icon file-------------------->
      if (newIcon) {
        await FileModel.updateOne(
          { _id: category.icon._id },
          { $set: { public_id: newIcon!.public_id, url: newIcon.secure_url } }
        );
        //<----------------delete old image from cloudinary-------------------->
        await delete_cloudinary(oldICon.public_id);

        //<----------------remove local file-------------------->
        removeLocalFiles(iconPath!);
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

export {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
