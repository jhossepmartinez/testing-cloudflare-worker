import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { qaHistory } from "./db/schema";
import OpenAI from "openai";
import jwt from "@tsndr/cloudflare-worker-jwt";
import { is } from "drizzle-orm";

interface Env {
  DB: DrizzleD1Database;
  OPENAI_API_KEY: string;
  GH_CLIENT_ID: string;
  GH_CLIENT_SECRET: string;
  JWT_SECRET: string;
}

type Ctx = {
  waitUntil: (...args: any) => void;
};

let openai: OpenAI;

export default {
  async fetch(request: Request, env: Env, ctx: Ctx) {
    const url = new URL(request.url);
    const route = url.pathname;

    if (route === "/login") {
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GH_CLIENT_ID}&scope=read:user`;
      return Response.redirect(githubAuthUrl);
    }

    if (route === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("Missing code", { status: 400 });

      try {
        // Exchange the code for an Access Token
        const tokenResponse = await fetch(
          "https://github.com/login/oauth/access_token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              client_id: env.GH_CLIENT_ID,
              client_secret: env.GH_CLIENT_SECRET,
              code,
            }),
          },
        );

        const tokenData = (await tokenResponse.json()) as {
          access_token?: string;
        };
        if (!tokenData.access_token) {
          return new Response("Failed to get access token", { status: 401 });
        }

        // Fetch user details from GitHub (Optional but recommended to embed user ID in JWT)
        const userResponse = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "User-Agent": "Cloudflare-Worker",
          },
        });
        const userData = (await userResponse.json()) as {
          id: number;
          login: string;
        };

        // Sign the JWT
        const token = await jwt.sign(
          {
            sub: userData.id.toString(),
            username: userData.login,
            exp: Math.floor(Date.now() / 1000) + 24 * (60 * 60), // Expires in 24 hours
          },
          env.JWT_SECRET,
        );

        // Return the token (You could also set this as an HttpOnly cookie)
        return new Response(
          JSON.stringify({
            token,
            message: "Save this token and pass it as a Bearer header to /ask",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (error) {
        return new Response("OAuth Callback Failed", { status: 500 });
      }
    }

    if (route === "/ask") {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader)
        return new Response("Missing Authorization header", { status: 401 });
      if (
        !authHeader.startsWith("Bearer ") ||
        authHeader.split(" ").length !== 2
      )
        return new Response("Invalid Authorization header", { status: 401 });

      const token = authHeader.split(" ")[1];
      const isValid = await jwt.verify(token, env.JWT_SECRET);

      if (!isValid)
        return new Response("Unauthorized: Invalid token", { status: 403 });

      const question = url.searchParams.get("question");

      if (!question)
        return new Response("Missing required 'question' search parameter.", {
          status: 400,
        });

      if (!openai) openai = new OpenAI();

      const db = drizzle(env.DB);

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5-nano",
          max_tokens: 512,
          messages: [{ role: "user", content: question }],
        });

        const answer = response.choices[0]?.message?.content;

        if (!answer)
          return new Response("The AI could not generate a response.", {
            status: 422,
          });

        ctx.waitUntil(db.insert(qaHistory).values({ question, answer }));

        return new Response(answer, { status: 200 });
      } catch (exception) {
        console.error("Message generation failed:", exception);
        return new Response(
          "Something went wrong while handling your question.",
          { status: 500 },
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
