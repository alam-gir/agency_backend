import { Response } from "express";
import { IUser } from "../../models/user.model";

export const loginTheUser = async ({
  user,
  response,
}: {
  user: IUser;
  response: Response;
}) => {
  try {
    const access_token = user.generateAccessToken();
    const refresh_token = user.generateRefreshToken();

    // set the refresh token in DB
    user.refreshToken?.push(refresh_token);
    await user.save();

    response.cookie("access_token", access_token, {
      httpOnly: true,
      secure: true,
      maxAge: 1000 * 60 * 15, // 15 minutes
      sameSite: "none",
    });
    response.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 15, // 15 days
      sameSite: "none",
    });

    if (!access_token && !refresh_token) {
      return null;
    }
    return { access_token, refresh_token };
  } catch (error) {
    return null;
  }
};
