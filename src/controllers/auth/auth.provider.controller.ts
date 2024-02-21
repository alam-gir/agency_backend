import { Request, Response } from "express";
import { ApiError } from "../../utils/apiError";
import { createUser, findUserByEmail } from "../../lib/data/userData";
import { loginTheUser } from "../../lib/auth/login-the-user";
import { providers } from "../../lib/providers";

const redirectToAuthUrl = async (req: Request, res: Response) => {
  const provider = req.params.provider;

  if (!provider) return new ApiError(400, "no provider found");

  const authUrl = getAuthUrl(provider);

  if (!authUrl)
    return res.status(400).json({ message: "auth url not generated!" });

  return res.status(200).json({ redirectUrl: authUrl });
};

const loginProvider = async (req: Request, res: Response) => {
  const provider = req.params.provider;
  const code = req.query.code;

  try {
    if (!provider) throw new ApiError(400, "Provider required!");
    if (!code) throw new ApiError(400, "Code required!");

    const access_token = await getAccessToken({
      provider: provider!,
      code: code as string,
    });

    if (!access_token) throw new ApiError(400, "Failed to fetch access token!");

    const userInfo = await getUserInfo({
      access_token: access_token as string,
      provider: provider,
    });

    if (!userInfo) throw new ApiError(400, "Failed to fetch user info!");
    let dbUser = await getDbUser(userInfo.email);

    if (!dbUser) {
      // register new provider account
      dbUser = await createUser({
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.picture,
        provider: true,
      });
    }

    if (!dbUser)
      throw new ApiError(500, "Failed to create / find user in database!");

    const tokens = await loginTheUser({ user: dbUser, response: res });

    if (!tokens) throw new ApiError(500, "Failed to login user!");

    return res.status(200).redirect(process.env.FORNTEND_BASE_URL!);
  } catch (error) {
    console.log({error})
    if (error instanceof ApiError)
      return res
        .status(error.statusCode)
        .json({ message: error.message, success: false });
    return res.status(500).json({
      message: (error as any).message || "Internal server error when try to login with provider!",
    });
  }
};

// <--------------------- sub functions ------------------->

const getAuthUrl = (provider: string) => {
  const redirectUri = `${process.env.BASE_API_V1_URL}/auth/login/${provider}/callback`;
  switch (provider) {
    case "google":
      return providers.google.getAuthLink(redirectUri);
    case "facebook":
      return providers.facebook.getAuthLink(redirectUri);
    case "github":
      return providers.github.getAuthLink(redirectUri);
    default:
      return null;
  }
};

const getAccessToken = async ({
  provider,
  code,
}: {
  provider: string;
  code: string;
}) => {
  switch (provider) {
    case "google":
      return await providers.google.getAccessToken({ code });
    case "facebook":
      return providers.facebook.getAccessToken({ code });
    case "github":
      return providers.github.getAccessToken({ code });
    default:
      return null;
  }
};


const getUserInfo = async ({
  access_token,
  provider,
}: {
  access_token: string;
  provider: string;
}) => {
  switch (provider) {
    case "google":
      return await providers.google.getUserInfo(access_token);
    case "facebook":
      return await providers.facebook.getUserInfo(access_token);
    case "github":
      return await providers.github.getUserInfo(access_token);
    default:
      return null;
  }
};


const getDbUser = async (email: string) => {
  const dbUser = await findUserByEmail(email);
  if (!dbUser) return null;
  return dbUser;
};



// <--------------------- exports ------------------->
export { redirectToAuthUrl, loginProvider };
