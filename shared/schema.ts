import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// News data model
export const newsItems = pgTable("news_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(),
  sourceType: text("source_type").notNull(),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  sharedTo: jsonb("shared_to").$type<string[]>().default([]),
});

export const insertNewsItemSchema = createInsertSchema(newsItems).omit({
  id: true,
  publishedAt: true,
  sharedTo: true,
});

// Integration platforms (Discord, X/Twitter, WordPress, etc.)
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // discord, twitter, wordpress, etc.
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  webhookUrl: text("webhook_url"),
  isSource: boolean("is_source").default(false),
  isDestination: boolean("is_destination").default(false),
  status: text("status").notNull().default("disconnected"),
  lastSyncAt: timestamp("last_sync_at"),
  additionalConfig: jsonb("additional_config"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true, 
  createdAt: true
});

// User data model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  avatar: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type NewsItem = typeof newsItems.$inferSelect;
export type InsertNewsItem = z.infer<typeof insertNewsItemSchema>;
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
