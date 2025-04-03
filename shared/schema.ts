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

// Extension for the Bird type that includes the seen status
export interface BirdWithSeenStatus extends Bird {
  seen: boolean;
}

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

// Bird sightings table to track birds a user has seen
export const birdSightings = pgTable("bird_sightings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  birdId: integer("bird_id").notNull(),
});

export const insertBirdSightingSchema = createInsertSchema(birdSightings).pick({
  userId: true,
  birdId: true,
});

export type InsertBirdSighting = z.infer<typeof insertBirdSightingSchema>;
export type BirdSighting = typeof birdSightings.$inferSelect;
