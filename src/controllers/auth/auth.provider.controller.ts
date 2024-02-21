import { Request, Response } from "express";
import { ApiError } from "../../utils/apiError";
import { createUser, findUserByEmail } from "../../lib/data/userData";
import { loginTheUser } from "../../lib/auth/login-the-user";

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
    console.log({userInfo});

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
    if (error instanceof ApiError)
      return res
        .status(error.statusCode)
        .json({ message: error.message, success: false });
    return res.status(500).json({
      message: "Internal server error when try to login with provider!",
    });
  }
};

// <--------------------- sub functions ------------------->

const getAuthUrl = (provider: string) => {
  const redirectUri = `${process.env.BASE_API_V1_URL}/auth/login/${provider}/callback`;
  switch (provider) {
    case "google":
      return googleAuthLink(redirectUri);
    case "facebook":
      return facebookAuthLink(redirectUri);
    case "github":
      return githubAuthLink(redirectUri);
    default:
      return null;
  }
};

const googleAuthLink = (redirectUri: string) => {
  const scope = encodeURIComponent(
    "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
  );
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
};
const facebookAuthLink = (redirectUri: string) => {
  return "";
};
const githubAuthLink = (redirectUri: string) => {
  return "";
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
      return await getGoogleAccessToken({ code });
    case "facebook":
      return "";
    case "github":
      return "";
    default:
      return null;
  }
};

const getGoogleAccessToken = async ({ code }: { code: string }) => {
  const data: Record<string, string> = {
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    code,
    redirectUri: `${process.env.BASE_API_V1_URL}/auth/login/google/callback`,
    grant_type: "authorization_code",
  };

  const response = await fetch(`https://oauth2.googleapis.com/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(data),
  });

  const result = await response.json();

  return result.access_token;
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
      return await getGoogleUserInfo(access_token);
    case "facebook":
      return await getFacebookUserInfo(access_token);
    case "github":
      return await getGithubUserInfo(access_token);
    default:
      return null;
  }
};

const getGoogleUserInfo = async (access_token: string) => {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`
  );

  const user = await response.json();

  return user;
};

const getFacebookUserInfo = async (access_token: string) => {};
const getGithubUserInfo = async (access_token: string) => {};

const getDbUser = async (email: string) => {
  const dbUser = await findUserByEmail(email);
  if (!dbUser) return null;
  return dbUser;
};

// <--------------------- exports ------------------->
export { redirectToAuthUrl, loginProvider };
