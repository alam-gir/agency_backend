import { NextFunction, Response } from "express";
import { IGetUserInterfaceRequst } from "../../@types/custom";
import { UserModel } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { matchedData, validationResult } from "express-validator";
import { cookieOptions } from "../utils/cookieOptions";

export const createGuestUser = async (
  req: IGetUserInterfaceRequst,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  try {
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(new ApiError(400, "Validation Error!", errors.array()));
    }
    // check access token have or not,
    const token =
      req.cookies?.access_token ||
      req.headers.authorization?.replace("Bearer ", "");

    // IF USER LOGGED IN THEN SKIP TO CREATE GUEST ACCOUNT
    if (token) return next();

    // IF BUYER IS NOT USER THEN CREATE A GUEST ACCOUNT AND LOGIN

    const guest = matchedData(req);

    // check email is exist or not
    let user: any = await UserModel.findOne({ email: guest.email });
    if(user){
      throw new ApiError(400, "Already have an account with this mail, Please login with password! Your password is 'guest', if previosly you have logged in as guest!");
    }

    if (!user) {
      user = await UserModel.create({
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        role: "guest",
        password: "guest",
      })
        .then((user) => user)
        .catch((err) => {
          if (err) throw new ApiError((err as any).code, (err as any).message);
        });
    }

    if (!user)
      throw new ApiError(400, "something went wrong! guest user not created!");

    const refresh_token = user.generateRefreshToken();
    const access_token = user.generateAccessToken();

    user.refreshToken = refresh_token;

    await user.save();

    req.cookies.access_token = access_token;
    req.cookies.refresh_token = refresh_token;

    res.cookie("access_token", access_token, cookieOptions(15 * 60, 15 * 60));
    res.cookie(
      "refresh_token",
      refresh_token,
      cookieOptions(60 * 60 * 24 * 30, 60 * 60 * 24 * 30)
    );

    next();
  } catch (error) {
    // instance of ApiError
    // validationError
    // castError
    // DuplicateKeyError 11000 | 11001
    // interval error
    if (error instanceof ApiError) {
      if (error.statusCode === 11000 || error.statusCode === 11001)
        return res.status(409).json(new ApiError(409, "duplicate"));
      return res.status(error.statusCode).json(new ApiError(error.statusCode, error.message));
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(404).json(new ApiError(404, (error as any).message));
    } else if (
      (error as any).code === "11000" ||
      (error as any).code === "11001"
    ) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res
        .status(500)
        .json(
          new ApiError(
            500,
            "Internal server error from creating guest account!"
          )
        );
    }
  }
};
