import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import { qaHistory, users } from "../db/schema";
import * as schema from "../db/schema";
import * as relations from "../db/relations";

export const createQuestionRepository = (
  db: D1Database,
  ctx: ExecutionContext,
) => {
  const orm = drizzle(db, { schema: { ...schema, ...relations } });

  return {
    saveHistoryInBackground: (
      userId: number,
      question: string,
      answer: string,
    ) => {
      const insertPromise = orm
        .insert(qaHistory)
        .values({ question, answer, userId });

      ctx.waitUntil(insertPromise);
    },
    getUserHistory: async (sub: string) => {
      return await orm.query.users.findFirst({
        where: eq(users.sub, sub),
        with: {
          qaHistory: {
            orderBy: [desc(qaHistory.createdAt)],
          },
        },
      });
    },
    getUser: async (sub: string) => {
      const user = await orm
        .select()
        .from(users)
        .where(eq(users.sub, sub))
        .get();
      if (!user) return null;
      return user;
    },
    saveUser: (username: string, sub: string) => {
      const insertPromise = orm.insert(users).values({ sub, username });
      ctx.waitUntil(insertPromise);
    },
  };
};
