export const verifyUserProvider = async (account: any) => {
  const { provider, access_token, id_token } = account;

  // if google
  if (provider === "google") {
    // check if user exists
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${id_token}`
    );
    if (!res.ok) return null;

    const data = await res.json();

    return { ...account, providerAccountId: data.sub.toString() };
  }
  // if gihub
  if (provider === "github") {
    // check if user exists
    const res = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();

    return { ...account, providerAccountId: data.id.toString() };
  }
  return null;
};
