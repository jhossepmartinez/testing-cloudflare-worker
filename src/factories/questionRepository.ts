import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import { qaHistory } from "../db/schema";

export const createQuestionRepository = (
  db: D1Database,
  ctx: ExecutionContext,
) => {
  const orm = drizzle(db);

  return {
    saveHistoryInBackground: (
      userId: string,
      username: string,
      question: string,
      answer: string,
    ) => {
      const insertPromise = orm
        .insert(qaHistory)
        .values({ question, answer, sub: userId, username });

      ctx.waitUntil(insertPromise);
    },
    getUserHistory: async (userId: string) => {
      return orm
        .select()
        .from(qaHistory)
        .where(eq(qaHistory.sub, userId))
        .orderBy(desc(qaHistory.createdAt));
    },
  };
};
