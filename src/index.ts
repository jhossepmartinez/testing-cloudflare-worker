import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { qaHistory } from "./db/schema";
import OpenAI from "openai";

interface Env {
  DB: DrizzleD1Database;
  OPENAI_API_KEY?: string;
}

type Ctx = {
  waitUntil: (...args: any) => void;
};

export default {
  async fetch(request: Request, env: Env, ctx: Ctx) {
    const url = new URL(request.url);
    const question = url.searchParams.get("question");

    if (!question)
      return new Response("Missing required 'question' query parameter.", {
        status: 400,
      });

    const client = new OpenAI();
    // apiKey: env.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    const db = drizzle(env.DB);

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: question,
          },
        ],
      });

      const answer = response.choices[0]?.message?.content;

      if (!answer)
        return new Response("The AI could not generate a response.", {
          status: 422,
        });

      // Fire-and-forget: don't block the response on the DB write.
      // waitUntil keeps the worker alive to finish the write after responding.
      ctx.waitUntil(db.insert(qaHistory).values({ question, answer }));

      return new Response(answer, { status: 200 });
    } catch (exception) {
      console.error("Message generation failed:", exception);
      return new Response(
        "Something went wrong while handling your question.",
        { status: 500 },
      );
    }
  },
};
