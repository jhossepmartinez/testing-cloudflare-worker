import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { qaHistory } from "./db/schema";

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

    const ai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });
    const db = drizzle(env.DB);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: question,
        config: {
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            },
          ],
        },
      });

      const answer = response.text;
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
