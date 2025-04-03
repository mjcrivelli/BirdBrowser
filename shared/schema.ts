import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const birds = pgTable("birds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  scientificName: text("scientific_name").notNull(),
  description: text("description").notNull(),
  habitat: text("habitat").notNull(),
  diet: text("diet").notNull(),
  imageUrl: text("image_url").notNull(),
  wikipediaUrl: text("wikipedia_url").notNull(),
});

export const insertBirdSchema = createInsertSchema(birds).pick({
  name: true,
  scientificName: true,
  description: true,
  habitat: true,
  diet: true,
  imageUrl: true,
  wikipediaUrl: true,
});

export type InsertBird = z.infer<typeof insertBirdSchema>;
export type Bird = typeof birds.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
