import { Response } from "express";

export const setCookieToBrowser = (
  res: Response,
  name: string,
  value: string,
  maxAgeInSeconds: number
) => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: maxAgeInSeconds * 1000, // 30 days
  });
};

export const clearCookieFromBrowser = (res: Response, name: string) => {
  res.cookie(name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    sameSite: "none",
  });
};
