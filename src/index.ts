import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { qaHistory } from "./db/schema";
import OpenAI from "openai";

interface Env {
  DB: DrizzleD1Database;
  OPENAI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env) {
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
        model: "gpt-5-nano",
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

      await db.insert(qaHistory).values({ question, answer });

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
