const cookieOptions = (
  expiresInSec: number,
  maxAgeInSec: number,
  secure: boolean = false,
  httpOnly: boolean = false,
  sameSite: "strict" | "lax" | "none" | undefined = "none"
) => {
  return {
    expires: new Date(Date.now() + 1000 * expiresInSec),
    maxAge: maxAgeInSec * 1000,
    secure: secure,
    httpOnly: httpOnly,
    sameSite: sameSite,
  };
};

export { cookieOptions };
