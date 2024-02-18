import { Request, Response } from "express";
import { IGetUserInterfaceRequst } from "../../@types/custom";
import { IUserPopulate, UserModel } from "../models/user.model";
import { delete_cloudinary, upload_cloudinary } from "../utils/cloudinary";
import { ImageModel } from "../models/image.model";
import { matchedData, validationResult } from "express-validator";
import fs from "fs";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";

const updateAvatar = async (req: IGetUserInterfaceRequst, res: Response) => {
  // grab new avatar
  const avatarPath = req.file?.path;
  if (!avatarPath)
    return res.status(404).json(new ApiError(404, "Avatar Path Not Found!"));

  const user = req.user;
  try {
    const userData = (await UserModel.findById(user?._id).populate(
      "avatar"
    )) as IUserPopulate;

    if (!userData)
      return res.status(404).json(new ApiError(404, "User Path Not Found!"));

    // const isValidPass = await userData.isPasswordValid(password);
    // if (!isValidPass)
    //   throw new ApiError(404, "Invalid Password!");

    // update new avatar in upload_cloudinary
    const uploadedAvatar = (await upload_cloudinary(
      avatarPath as string,
      process.env.AVATAR_FOLDER as string
    )) as any;

    // if(userData.avatar?.public_id && uploadedAvatar?.public_id){
    //   await delete_cloudinary(userData.avatar.public_id);
    // }

    // clear the image from local path

    if (fs.existsSync(avatarPath!)) {
      fs.unlinkSync(avatarPath!);
    }

    const image = await ImageModel.findOneAndUpdate(
      { _id: userData.avatar },
      {
        url: uploadedAvatar?.secure_url!,
        public_id: uploadedAvatar?.public_id!,
      },
      { new: true }
    );

    if (!image)
      return res.status(403).json(new ApiError(403, "Avatar Update Failed!"));

    return res.status(200).json(
      new ApiResponse(200, "Avatar Update Successfuly!", {
        avatar: image.url,
      })
    );
    //success - delete previous avatar from cloudinary
  } catch (error) {
    if (fs.existsSync(avatarPath!)) {
      fs.unlinkSync(avatarPath!);
    }
    // instance of ApiError
    // validationError
    // castError
    // DuplicateKeyError 11000 | 11001
    // interval error

    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ message: error.message, status: error.statusCode });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res
        .status(500)
        .json(new ApiError(500, "Internal server error from change avatar!"));
    }
  }
};

const updatePassword = async (req: IGetUserInterfaceRequst, res: Response) => {
  // grab passwords
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(404).json(errors);

  const user = req.user;
  const passwords = matchedData(req) as {
    current_password: string;
    confirm_password: string;
  };

  try {
    const userData = await UserModel.findById(user?._id);
    if (!userData)
      return res.status(404).json(new ApiError(404, "User Not Found!"));
    const isValidPass = await userData?.isPasswordValid(
      passwords.current_password
    );
    if (!isValidPass)
      return res.status(400).json(new ApiError(400, "Invalid Old Password!"));

    userData.password = passwords.confirm_password;
    const updatedPassword = await userData.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Password Change Successfuly!"));
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
        .json(new ApiError(500, "Internal server error from change password!"));
    }
  }
};

const updateEmail = async (req: IGetUserInterfaceRequst, res: Response) => {
  //get user,
  // new email and current password
  // current password validity
  // save email

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(404).json(errors);
  const JWTUser = req.user;
  const data = matchedData(req) as { email: string; current_password: string };
  try {
    const user = await UserModel.findById(JWTUser?._id);
    if (!user)
      return res.status(404).json(new ApiError(404, "User not found!"));

    const isValidPass = await user?.isPasswordValid(data.current_password);
    if (!isValidPass)
      return res.status(400).json(new ApiError(400, "Wrong Password!"));

    user!.email = data.email;
    const updatedUser = await user?.save();

    return res.status(200).json(
      new ApiResponse(200, "New Email Updated Successful!", {
        emai: updatedUser.email,
      })
    );
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
        .json(new ApiError(500, "Internal server error from change email!"));
    }
  }
};
const updatePhone = async (req: IGetUserInterfaceRequst, res: Response) => {
  //get user,
  // new phone and current password
  // current password validity
  // save phone

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(404).json(errors);
  const JWTUser = req.user;
  const data = matchedData(req) as { phone: string; current_password: string };
  try {
    const user = await UserModel.findById(JWTUser?._id);
    const isValidPass = await user?.isPasswordValid(data.current_password);
    if (!isValidPass)
      return res.status(400).json(new ApiError(400, "Invalid Password!"));

    user!.phone = data.phone;
    const updatedUser = await user?.save();

    return res.status(200).json(
      new ApiResponse(200, "Phone Number change Successful!", {
        newPhone: updatedUser!.phone,
      })
    );
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
        .json(
          new ApiError(500, "Internal server error from change phone number!")
        );
    }
  }
};

const updateName = async (req: IGetUserInterfaceRequst, res: Response) => {
  //get user,
  // new name and current password
  // current password validity
  // save name
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(404).json(errors.array());
  const JWTUser = req.user;
  const data = matchedData(req) as { name: string; current_password: string };
  try {
    const user = await UserModel.findById(JWTUser?._id);
    if (!user)
      return res.status(404).json(new ApiError(404, "User Not Found!"));

    const isValidPass = await user?.isPasswordValid(data.current_password);
    if (!isValidPass)
      return res.status(400).json(new ApiError(400, "Invalid Password!"));

    user!.name = data.name;
    const updatedUser = await user?.save();
    const returnData = {
      _id: updatedUser._id,
      name: updatedUser!.name,
      email: updatedUser!.email,
      phone: updatedUser!.phone,
      avatar: updatedUser!.avatar,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, "Name Chage Successfull!", returnData));
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
        .json(new ApiError(500, "Internal server error from change name!"));
    }
  }
};

const updateRole = async (req: IGetUserInterfaceRequst, res: Response) => {
  //get user,
  // new role and current password
  // current password validity
  // save role

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(404).json(errors);
  const JWTUser = req.user;
  const data = matchedData(req) as { role: string; current_password: string };
  try {
    const user = await UserModel.findById(JWTUser?._id);
    if (!user)
      return res.status(404).json(new ApiError(404, "User Not Found!"));

    const isValidPass = await user?.isPasswordValid(data.current_password);
    if (!isValidPass)
      return res.status(400).json(new ApiError(400, "Invalid Password!"));

    user!.role = data.role;
    const updatedUser = await user?.save();

    return res.status(200).json(
      new ApiResponse(200, "User Role update Successful!", {
        newRole: updatedUser.role,
      })
    );
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
        .json(new ApiError(500, "Internal server error from change role!"));
    }
  }
};

const deleteUser = async (req: IGetUserInterfaceRequst, res: Response) => {
  //get user,
  // current password validity
  /* take time to delete, {
        log out the user,
        if user not logged in between a sertain time then permanenty delete otherwise cancel the delete appeal.
  }*/

  try {
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error from update role section." });
  }
};

const getUser = async (req: IGetUserInterfaceRequst, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(404).json({ message: "User Not Found!" });
  }
  return res.status(200).json({ message: "User Found!", user: user });
};

const getAllUsers = async (req: IGetUserInterfaceRequst, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const skip = req.query.skip ? page - 1 * limit : 0;
  try {
    const users = await UserModel.find({})
      .skip(skip)
      .limit(limit)
      .select("-password -refreshToken")
      .then((docs) => docs)
      .catch((err) => {
        throw new ApiError(err.statusCode, err.message);
      });
    return res
      .status(200)
      .json(new ApiResponse(200, "All Users Found!", users));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiError(500, "Internal server error from get all users section.")
      );
  }
};

const getEmailVerificationStatus = async (req: Request, res: Response) => {
  const email = req.query.email;
  try {
    if (!email) throw new ApiError(404, "Email Not Found!");

    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(404, "User Not Found!");

    if (!user.emailVarified) return res.status(403).json("Email Not Verified!");
    return res.status(200).json("Email Verified!");
  } catch (error) {
    if (error instanceof ApiError)
      return res.status(error.statusCode).json({ error: error.message });
    return res.status(500).json({ error: (error as any).message });
  }
};

export {
  getUser,
  getEmailVerificationStatus,
  getAllUsers,
  updateAvatar,
  updatePassword,
  updateEmail,
  updatePhone,
  updateName,
  updateRole,
};
