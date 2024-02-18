import { NextFunction, Response } from "express";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { UserModel, IUser } from "../models/user.model";
import { IGetUserInterfaceRequst } from "../../@types/custom";
import fs from "fs";
import { ApiError } from "../utils/apiError";

export const verifyJWT = async (
  req: IGetUserInterfaceRequst,
  res: Response,
  next: NextFunction
) => {
  // check access token have or not,
  // verify token
  // decode token
  // find user by token information
  // add user to request object
  // next();
  try {
    const token =
      req.cookies?.access_token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "unathorized");

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as IUser;

    if (!decodedToken) throw new ApiError(401, "unathorized!");

    const user = await UserModel.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) throw new ApiError(404, "user not found!");

    req.user = user;

    next();
  } catch (error) {
    fs.readdir("./public/temp/", (err, files) => {
      // files iterables
      if (Array.isArray(files)) {
        for (let file of files) {
          if (fs.existsSync(`./public/temp/${file}`)) {
            fs.unlinkSync(`./public/temp/${file}`);
          }
        }
      }
    });
    // instance of ApiError
    // validationError
    // castError
    // DuplicateKeyError 11000 | 11001
    // interval error

    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json(new ApiError(error.statusCode, error.message));
    } else if (error instanceof JsonWebTokenError) {
      return res.status(401).json(new ApiError(401, "unathorized!"));
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(404).json(new ApiError(404, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res
        .status(500)
        .json(
          new ApiError(500, "Internal server error from upload project image!")
        );
    }
  }
};
