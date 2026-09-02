import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  title: varchar("title", { length: 255 }).notNull(),
  language: varchar("language", { length: 16 }).default("en").notNull(),
  jurisdiction: varchar("jurisdiction", { length: 80 }).default("India").notNull(),
  productType: varchar("productType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sources = mysqlTable("sources", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  publisher: varchar("publisher", { length: 255 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 80 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["DEMO SOURCE", "VERIFIED SOURCE"]).notNull(),
  indexedAt: timestamp("indexedAt"),
  documentCount: int("documentCount").default(0).notNull(),
});

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: varchar("sourceId", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  documentType: varchar("documentType", { length: 100 }),
  sourceUrl: text("sourceUrl"),
  version: varchar("version", { length: 80 }),
  retrievedAt: timestamp("retrievedAt"),
  chunkCount: int("chunkCount").default(0).notNull(),
});

export const citations = mysqlTable("citations", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId"),
  documentId: int("documentId"),
  citationId: varchar("citationId", { length: 100 }).notNull(),
  section: varchar("section", { length: 255 }),
  excerpt: text("excerpt"),
  relevanceScore: varchar("relevanceScore", { length: 20 }),
  retrievedAt: timestamp("retrievedAt"),
});

export const screenings = mysqlTable("screenings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  productName: varchar("productName", { length: 255 }).notNull(),
  targetMarket: varchar("targetMarket", { length: 80 }).notNull(),
  input: text("input").notNull(),
  result: text("result").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  mode: varchar("mode", { length: 40 }).default("DEMO MODE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const savedResearch = mysqlTable("saved_research", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  kind: varchar("kind", { length: 80 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  referenceId: varchar("referenceId", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
