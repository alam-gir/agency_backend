export const providers = {
  google: {
    getAuthLink: (redirectUri: string) => {
      const scope = encodeURIComponent(
        "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
      );
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    },
    getAccessToken: async ({ code }: { code: string }) => {
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
    },
    getUserInfo: async (access_token: string) => {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`
      );

      const user = await response.json();

      return user;
    },
  },
  facebook: {
    getAuthLink: (redirectUri: string) => {
      const scope = encodeURIComponent("public_profile,email");
      return `https://www.facebook.com/v13.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    },
    getAccessToken: async ({ code }: { code: string }) => {
      const data: Record<string, string> = {
        client_id: process.env.FACEBOOK_CLIENT_ID || "",
        client_secret: process.env.FACEBOOK_CLIENT_SECRET || "",
        code,
        redirectUri: `${process.env.BASE_API_V1_URL}/auth/login/facebook/callback`,
        grant_type: "authorization_code",
      };

      const response = await fetch(
        `https://graph.facebook.com/v13.0/oauth/access_token?client_id=${data.client_id}&redirect_uri=${data.redirectUri}&client_secret=${data.client_secret}&code=${code}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(data),
        }
      );

      const result = await response.json();
      console.log({ result });

      return result.access_token;
    },
    getUserInfo: async (access_token: string) => {
      const response = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`
      );

      const user = await response.json();
      console.log({ user });

      return user;
    },
  },
  github: {
    getAuthLink: (redirectUri: string) => {
      const scope = encodeURIComponent("user:email read:user");
      return `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    },
    getAccessToken: async ({ code }: { code: string }) => {
      const data: Record<string, string> = {
        client_id: process.env.GITHUB_CLIENT_ID || "",
        client_secret: process.env.GITHUB_CLIENT_SECRET || "",
        code,
        redirectUri: `${process.env.BASE_API_V1_URL}/auth/login/github/callback`,
        grant_type: "authorization_code",
      };

      const response = await fetch(
        `https://github.com/login/oauth/access_token?client_id=${data.client_id}&client_secret=${data.client_secret}&code=${code}&redirect_uri=${data.redirectUri}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();
      console.log({ result });
      return result.access_token;
    },
    getUserInfo: async (access_token: string) => {
      let user = await fetch(
        `https://api.github.com/user?access_token=${access_token}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      user = await user.json();

      let email = await fetch(
        `https://api.github.com/user/emails?access_token=${access_token}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      email = await email.json();
      email = (email as any).filter((e: any) => e.primary)[0].email;
      
      return{name: (user as any).name, email, avatar: (user as any).avatar_url} ;
    },
  },
};
