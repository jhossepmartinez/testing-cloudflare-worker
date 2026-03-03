import { relations } from "drizzle-orm";
import { qaHistory, users } from "./schema";

export const userRelations = relations(users, ({ many }) => ({
  qaHistory: many(qaHistory),
}));

export const qaHistoryRelations = relations(qaHistory, ({ one }) => ({
  user: one(users, {
    fields: [qaHistory.userId],
    references: [users.id],
  }),
}));
