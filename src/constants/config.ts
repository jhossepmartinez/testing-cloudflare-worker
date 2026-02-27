export const CONFIG = {
  GITHUB: {
    AUTH_URL: "https://github.com/login/oauth/authorize",
    TOKEN_URL: "https://github.com/login/oauth/access_token",
    API_USER_URL: "https://api.github.com/user",
    SCOPE: "read:user",
  },
  JWT: { EXPIRATION_SECONDS: 24 * 60 * 60 },
  AI: { MODEL: "gpt-5-nano", MAX_TOKENS: 500 },
} as const;
