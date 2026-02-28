import type { ExecutionContext } from "@cloudflare/workers-types";
import { Environment } from "./types";
import { handleAsk, handleCallback, handleLogin, handleHistory } from "./handlers";

export default {
  async fetch(
    request: Request,
    env: Environment,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/login":
        return handleLogin(env);
      case "/callback":
        return handleCallback(request, env);
      case "/ask":
        return handleAsk(request, env, ctx);
      case "/history":
        return handleHistory(request, env, ctx);
      default:
        return new Response("Not Found", { status: 404 });
    }
  },
};
