export const createAnalyticsLogger = (analytics: AnalyticsEngineDataset) => ({
  rateLimitExceeded: (userId: string, username: string) =>
    analytics.writeDataPoint({
      blobs: ["rate_limit_exceeded", username, userId],
      doubles: [1],
      indexes: [userId],
    }),
  askSuccess: (userId: string, username: string, tokensUsed: number) =>
    analytics.writeDataPoint({
      blobs: ["ask_success", username, userId],
      doubles: [1, tokensUsed],
      indexes: [userId],
    }),
  askError: (userId: string, username: string, error: unknown) =>
    analytics.writeDataPoint({
      blobs: ["ask_error", username, userId, String(error)],
      doubles: [1],
      indexes: [userId],
    }),
});
