import { OpenAI } from "openai/client.js";
import { CONFIG } from "./constants/config";
import { createAnalyticsLogger } from "./factories/analytics";
import { createGitHubAuth } from "./factories/githubAuth";
import { CustomJwtPayload, Environment } from "./types";
import jwt from "@tsndr/cloudflare-worker-jwt";
import { createQuestionRepository } from "./factories/questionRepository";

export const handleLogin = (env: Environment): Response => {
  const github = createGitHubAuth(env.GH_CLIENT_ID, env.GH_CLIENT_SECRET);
  return Response.redirect(github.getLoginUrl());
};

export const handleCallback = async (
  request: Request,
  env: Environment,
): Promise<Response> => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

  try {
    const github = createGitHubAuth(env.GH_CLIENT_ID, env.GH_CLIENT_SECRET);
    const githubToken = await github.exchangeCodeForToken(code);
    const userData = await github.getUserProfile(githubToken);

    console.log("handleCallback - env.JWT_SECRET:", env.JWT_SECRET);

    const token = await jwt.sign(
      {
        sub: userData.id.toString(),
        username: userData.login,
        exp: Math.floor(Date.now() / 1000) + CONFIG.JWT.EXPIRATION_SECONDS,
      },
      env.JWT_SECRET,
    );

    return new Response(
      JSON.stringify({
        token,
        message: "Use this token as a Bearer header to /ask",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("OAuth Callback Failed:", error);
    return new Response("OAuth Callback Failed", { status: 500 });
  }
};

export const handleAsk = async (
  request: Request,
  env: Environment,
  ctx: ExecutionContext,
): Promise<Response> => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Invalid Authorization header", { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  console.log("handleAsk - env.JWT_SECRET:", env.JWT_SECRET);
  const isValid = await jwt.verify(token, env.JWT_SECRET);
  if (!isValid)
    return new Response("Unauthorized: Invalid token", { status: 403 });

  const { payload } = jwt.decode(token) as { payload: CustomJwtPayload };
  const { sub: userId, username } = payload;

  const logger = createAnalyticsLogger(env.ANALYTICS);

  const { success: rateLimitSuccess } = await env.RATE_LIMIT.limit({
    key: userId,
  });
  if (!rateLimitSuccess) {
    logger.rateLimitExceeded(userId, username);
    return new Response(`Rate limit exceeded`, { status: 429 });
  }

  const question = new URL(request.url).searchParams.get("question");
  if (!question)
    return new Response("Missing 'question' parameter.", { status: 400 });

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: CONFIG.AI.MODEL,
      messages: [{ role: "user", content: question }],
      max_completion_tokens: CONFIG.AI.MAX_TOKENS,
    });

    const answer = response.choices[0]?.message?.content;
    if (!answer)
      return new Response("The AI could not generate a response.", {
        status: 422,
      });

    const repo = createQuestionRepository(env.DB, ctx);
    repo.saveHistoryInBackground(userId, username, question, answer);

    logger.askSuccess(userId, username, response.usage?.total_tokens ?? 0);

    return new Response(answer, { status: 200 });
  } catch (error) {
    console.error("Message generation failed:", error);
    logger.askError(userId, username, error);
    return new Response("Something went wrong handling your question.", {
      status: 500,
    });
  }
};
