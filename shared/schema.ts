import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const birds = pgTable("birds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  scientificName: text("scientificName").notNull(),
  family: text("family"),
  habitat: text("habitat"),
  diet: text("diet"),
  conservationStatus: text("conservationStatus"),
  description: text("description"),
  wikipediaUrl: text("wikipediaUrl"),
  imageUrl: text("imageUrl"),
  category: text("category").default("common"), // common, rare, endangered
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBirdSchema = createInsertSchema(birds).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBird = z.infer<typeof insertBirdSchema>;
export type Bird = typeof birds.$inferSelect;
