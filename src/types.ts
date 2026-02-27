import { JwtPayload } from "@tsndr/cloudflare-worker-jwt";

export type Environment = {
  DB: D1Database;
  OPENAI_API_KEY: string;
  GH_CLIENT_ID: string;
  GH_CLIENT_SECRET: string;
  JWT_SECRET: string;
  RATE_LIMIT: RateLimit;
  ANALYTICS: AnalyticsEngineDataset;
};

export type CustomJwtPayload = JwtPayload & {
  username: string;
};
