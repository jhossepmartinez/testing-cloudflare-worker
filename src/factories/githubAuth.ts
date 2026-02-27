import { CONFIG } from "../constants/config";

export const createGitHubAuth = (clientId: string, clientSecret: string) => ({
  getLoginUrl: () =>
    `${CONFIG.GITHUB.AUTH_URL}?client_id=${clientId}&scope=${CONFIG.GITHUB.SCOPE}`,

  exchangeCodeForToken: async (code: string): Promise<string> => {
    const response = await fetch(CONFIG.GITHUB.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!response.ok)
      throw new Error(`Token exchange failed: ${response.status}`);
    const data = (await response.json()) as { access_token?: string };
    if (!data.access_token) throw new Error("No access token in response");
    return data.access_token;
  },

  getUserProfile: async (
    accessToken: string,
  ): Promise<{ id: number; login: string }> => {
    const response = await fetch(CONFIG.GITHUB.API_USER_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Cloudflare-Worker",
      },
    });

    if (!response.ok)
      throw new Error(`Profile fetch failed: ${response.status}`);
    return (await response.json()) as { id: number; login: string };
  },
});
