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

      const response = await fetch(`https://oauth2.facebook.com/token`, {
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
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`
      );

      const user = await response.json();

      return user;
    }
  },
  github: {
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
};
