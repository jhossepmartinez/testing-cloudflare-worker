import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { qaHistory } from "./db/schema";
import OpenAI from "openai";

interface Env {
  GOOGLE_API_KEY: string;
  DB: DrizzleD1Database;
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
    const db = drizzle(env.DB);

    try {
      const response = await client.responses.create({
        model: "gpt-5-nano",
        tools: [{ type: "web_search" }],
        input: question,
      });

      const answer = response.output_text;

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
