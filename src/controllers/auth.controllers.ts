import { Request, Response } from "express";
import { validationResult, matchedData } from "express-validator";
import { UserModel } from "../models/user.model";
import { IGetUserInterfaceRequst } from "../../@types/custom";
import JWT, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { clearCookieFromBrowser, setCookieToBrowser } from "../lib/utils";
import { findUserByRefreshToken } from "../lib/data/userData";
import { verifyUserProvider } from "../lib/verify-user-provider";
import { AccountModel } from "../models/account.model";
import { sendEmail } from "../lib/nodemailer";

import { v4 as uuidv4 } from "uuid";
import { emailVarificationTemplate } from "../lib/email-varification-template";
import { EmailVarificationCodeModel } from "../models/email-varification-token.model";

const registerUser = async (req: Request, res: Response) => {
  const userDataErrors = validationResult(req);
  if (!userDataErrors.isEmpty())
    return res
      .status(404)
      .json({ message: "data missing!", errors: userDataErrors });

  const userData = matchedData(req);
  try {
    const existUser = await UserModel.findOne({ email: userData?.email });
    if (existUser) {
      throw new ApiError(409, "User Already Registered with This mail!");
    }

    await UserModel.create(userData);

    res.status(201).json(new ApiResponse(201, "User registered Successful!"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(error.message);
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res
        .status(500)
        .json({ message: "Internal server error from create project!", error });
    }
  }
};

const loginUser = async (req: Request, res: Response) => {
  // catch if previous refresh token exist
  const prevRefreshToken =
    req.cookies?.refresh_token ||
    req.headers.authorization?.replace("Bearer ", "");
  // validate data
  const { email, password } = req.body;

  try {
    if (!email || !password)
      throw new ApiError(400, "Email and password required!");

    // get user by given email
    const user = await UserModel.findOne({ email });

    if (!user) throw new ApiError(404, "Invalidate credentials!");

    const isValidPass = await user.isPasswordValid(password);

    if (!isValidPass) throw new ApiError(404, "Invalid credentials!");

    // if successfull then login user
    // generate refresh token and access token,
    // send refresh token to the db
    // set cookie with refresh token & access token

    const access_token = user.generateAccessToken();
    const refresh_token = user.generateRefreshToken();

    // if previous refresh token exist then clean all tokens
    if (prevRefreshToken) {
      clearCookieFromBrowser(res, "refresh_token");
      user.refreshToken = [];
      await user.save();
    }

    // // set new refreshTokens
    await UserModel.updateOne(
      { _id: user._id },
      { $push: { refreshToken: refresh_token } }
    );

    res.cookie("refresh_token", refresh_token, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 24 * 15 * 1000, // 15 days
    });

    res.cookie("access_token", access_token, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 15 * 1000, // 15 minutes
    });

    // check email verified or not
    const isVarified = !!user.emailVarified;

    // send verification code
    if (!isVarified) {
      // generate code
      const code = Math.floor(10000 + Math.random() * 90000); // send 5 digits code

      // save this code in DB
      await EmailVarificationCodeModel.create({
        userId: user._id,
        code: code,
        expires: new Date().getTime() + 1000 * 60 * 5, // 5 minutes
      });

      // send email
      const mailInfo = await sendEmail({
        to: email,
        subject: "Email Verification from Pixwaf",
        html: emailVarificationTemplate(code),
      });

      return res.status(201).json({
        message: `Varification code sent! at ${email}`,
        access_token,
        refresh_token,
      });
    }
    return res
      .status(200)
      .json({ message: "Logged in successfull!", access_token, refresh_token });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(error);
    } else if ((error as any).name === "ValidationError") {
      return res.status(404).json(new ApiError(404, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(404).json(new ApiError(404, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res
        .status(500)
        .json(new ApiError(500, "Internal server error from login user!"));
    }
  }
};

const loginUserProvider = async (req: Request, res: Response) => {
  // catch if previous refresh token exist
  const prevRefreshToken =
    req.cookies?.refresh_token ||
    req.headers.authorization?.replace("Bearer ", "");

  const accountData = req.body.account;
  const userData = req.body.user;

  try {
    if (!accountData || !userData)
      throw new ApiError(404, "Account not found!");

    const verify = await verifyUserProvider(accountData);

    if (!verify) throw new ApiError(403, "Invalid Provider!");

    let account = await AccountModel.findOne({
      providerAccountId: verify.providerAccountId,
    });
    let user = await UserModel.findOne({ email: userData.email });

    if (!account && !user) {
      // register user
      user = await UserModel.create({
        name: userData.name,
        email: userData.email,
        avatar: userData.image,
        emailVarified: new Date(),
      });
      //  create new account
      account = await AccountModel.create({ ...verify, userId: user._id });
    }

    if (user && user.password)
      throw new ApiError(409, "User Already Registered with This mail!");

    if (!account || !user) throw new ApiError(403, "Failed to create user!");

    if (account.userId.toString() !== user._id.toString())
      throw new ApiError(403, "Invalid Provider!");

    // start login now
    const access_token = user.generateAccessToken();
    const refresh_token = user.generateRefreshToken();

    if (!access_token || !refresh_token)
      throw new ApiError(403, "Failed to create tokens!");

    // if previous refresh token exist then clean all tokens
    if (prevRefreshToken) {
      clearCookieFromBrowser(res, "refresh_token");
      user.refreshToken = [];
      await user.save();
    }

    // set new refreshTokens
    user.refreshToken = [...user.refreshToken!, refresh_token];
    await user.save();

    res.cookie("refresh_token", refresh_token, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 24 * 15 * 1000, // 15 days
    });

    res.cookie("access_token", access_token, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 15 * 1000, // 15 minutes
    });

    console.log({ access_token, refresh_token })
    console.log("logged in and set cookies..........")
    res.status(200).json({ access_token, refresh_token });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(error);
    } else if ((error as any).name === "ValidationError") {
      return res.status(404).json(new ApiError(404, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(404).json(new ApiError(404, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res
        .status(500)
        .json(new ApiError(500, "Internal server error from login user!"));
    }
  }
};

const updateProviderAccessToken = async (req: Request, res: Response) => {
  const providerId = req.params.id;
  const access_token = req.query.access_token as string;
  try {
    if (!providerId || !access_token)
      throw new ApiError(400, "ProviderId and AccessToken required!");

    const update = await AccountModel.updateOne(
      { providerAccountId: providerId },
      { $set: { access_token } }
    );

    if (!update) throw new ApiError(500, "Failed to update access token!");
    return res.status(200).json({ message: "Access token" });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(error);
    } else {
      return res
        .status((error as any).statusCode || 500)
        .json({ error: (error as any).message });
    }
  }
};

const logoutUser = async (req: IGetUserInterfaceRequst, res: Response) => {
  // clear matched refresh token from DB
  // invalidate matched access and refresh tokens from cookies

  try {
    let refreshToken =
      req.cookies?.refresh_token ||
      req.headers["refresh_token"]?.toString().replace("Bearer ", "");

    if (!refreshToken)
      return res.status(204).json(new ApiResponse(204, "No Content!"));

    //find user by refresh token
    const user = await findUserByRefreshToken(refreshToken);
    if (!user)
      return res.status(204).json(new ApiError(204, "User not found!"));

    // clear this from db refresh token
    const newRefreshTokenArray = user.refreshToken?.filter(
      (rt) => rt !== refreshToken
    );

    user.refreshToken = newRefreshTokenArray;

    await user.save();

    // clear cookies from browser and header
    res.cookie("refresh_token", "", {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      maxAge: 0,
    });
    res.cookie("access_token", "", {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      maxAge: 0,
    });

    res.status(200).json(new ApiResponse(200, "logout!"));
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

const refreshToken = async (req: Request, res: Response) => {
  // get refresh token from cookies or headers
  // decode user id
  // find user in db by id
  // check cookies token and db user token matched or not
  // not matched -> refresh token user or invalid
  // matched -> generate refresh token and access token
  // set refresh token to the DB
  // set cookies = refresh token and access token
  try {
    const refreshToken =
      req.cookies?.refresh_token ||
      (req.headers["refresh_token"] as string).replace("Bearer ", "");

    if (!refreshToken) throw new ApiError(404, "Unauthorized!");

    const decodeUserId = JWT.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as JwtPayload;

    if (!decodeUserId) throw new ApiError(400, "Invalid Token");

    const user = await findUserByRefreshToken(refreshToken);

    if (!user) throw new ApiError(404, "Used Token!");

    const newRefreshTokenArray = user.refreshToken?.filter(
      (rt) => rt !== refreshToken
    );

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = [...newRefreshTokenArray!, newRefreshToken];

    const saved = await user.save();

    if (!saved) throw new ApiError(403, "Token not saved in DB!");

    // save new refresh token in cookies and headers
    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 24 * 15 * 1000, // 15 days
    });

    res.cookie("access_token", newAccessToken, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 15 * 1000, // 15 minutes
    });

    return res.status(200).json({
      refresh_token: newRefreshToken,
      access_token: newAccessToken,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(error);
    } else if (error instanceof JsonWebTokenError) {
      return res.status(404).json(new ApiError(404, "Invalid Token"));
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

const sendVerificationMail = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    if (!email)
      return res.status(400).json(new ApiError(400, "Email required!"));

    // check exist or not
    const user = await UserModel.findOne({ email });

    if (!user) throw new ApiError(404, "User not found!");

    // check email verified or not
    const isVarified = !!user.emailVarified;
    if (isVarified) throw new ApiError(409, "Email already verified!");

    // generate token and expires
    const code = Math.floor(10000 + Math.random() * 90000); // send 5 digits code;
    const expires = new Date().getTime() + 1000 * 5; // 5 minutes

    // send email
    const mailInfo = await sendEmail({
      to: email,
      subject: "Thank you for regitering in pixwaf!",
      html: emailVarificationTemplate(3455),
    });
    if (!mailInfo) throw new ApiError(500, "Failed to send mail!");
    // save token to db
    const emailVerificationCode = await EmailVarificationCodeModel.create({
      userId: user._id,
      code,
      expires,
    });

    if (!emailVerificationCode)
      throw new ApiError(500, "Failed to save token!");

    return res
      .status(200)
      .json({ message: "Send verification mail! Check inbox." });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: (error as any).message });
  }
};

const verifyMail = async (req: Request, res: Response) => {
  const code = req.query.code;
  try {
    if (!code) throw new ApiError(400, "code required!");

    const emailVerificationcode = await EmailVarificationCodeModel.findOne({
      code,
    });

    if (!emailVerificationcode) throw new ApiError(404, "Invalid code!");

    const user = await UserModel.findOne({
      _id: emailVerificationcode.userId,
    });

    if (!user) throw new ApiError(404, "Invalid code!");

    const isVarified = !!user.emailVarified;

    if (isVarified)
      res.status(200).json({ message: "Email already verified!" });

    // check expires

    if (emailVerificationcode.expires < new Date())
      throw new ApiError(400, "Code expired!");

    user.emailVarified = new Date();

    // delete all the verification code of this user

    await EmailVarificationCodeModel.deleteMany({ userId: user._id });

    await user.save();

    res.status(200).json({ message: "Email verified successfull!" });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message });
    } else {
      return res
        .status((error as any).statusCode || 500)
        .json({ error: (error as any).message });
    }
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  loginUserProvider,
  updateProviderAccessToken,
  sendVerificationMail,
  verifyMail,
};
