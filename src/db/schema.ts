import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const qaHistory = sqliteTable("qa_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  userId: integer("user_id").references(() => users.id),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().default("[Missing username]"),
  sub: text("sub").notNull().unique(),
});
