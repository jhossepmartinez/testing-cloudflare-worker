import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";

export default {
  async fetch(request: Request, env) {
    const url = new URL(request.url);
    const question = url.searchParams.get("question");

    if (!question)
      return new Response("Missing the required 'question' query parameter.");

    const ai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });
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

      return new Response(`${response.text}`);
    } catch (exception) {
      console.error("Message generation failed:", exception);
      return new Response(
        "Something went wrong while handling your question.",
        { status: 400 },
      );
    }
  },
};
