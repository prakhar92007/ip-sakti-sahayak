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
  status: mysqlEnum("status", ["VERIFIED", "UNAVAILABLE", "ERROR", "PENDING"]).notNull(),
  officialUrl: text("officialUrl"),
  sourceType: varchar("sourceType", { length: 30 }),
  language: varchar("language", { length: 16 }),
  accessMethod: varchar("accessMethod", { length: 40 }),
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  failureReason: text("failureReason"),
  contentHash: varchar("contentHash", { length: 64 }),
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
  contentType: varchar("contentType", { length: 100 }),
  extractedText: text("extractedText"),
  contentHash: varchar("contentHash", { length: 64 }),
  status: mysqlEnum("status", ["VERIFIED", "UNAVAILABLE", "ERROR", "PENDING"]).default("PENDING").notNull(),
});

export const documentChunks = mysqlTable("document_chunks", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  chunkIndex: int("chunkIndex").notNull(),
  text: text("text").notNull(),
  startOffset: int("startOffset").notNull(),
  endOffset: int("endOffset").notNull(),
  section: varchar("section", { length: 255 }),
  page: varchar("page", { length: 40 }),
  heading: varchar("heading", { length: 255 }),
  canonicalUrl: text("canonicalUrl"),
  contentHash: varchar("contentHash", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const evidence = mysqlTable("evidence", {
  id: int("id").autoincrement().primaryKey(),
  evidenceId: varchar("evidenceId", { length: 100 }).notNull().unique(),
  sourceId: varchar("sourceId", { length: 64 }).notNull(),
  documentId: int("documentId"),
  chunkId: int("chunkId"),
  officialUrl: text("officialUrl").notNull(),
  section: varchar("section", { length: 255 }),
  page: varchar("page", { length: 40 }),
  excerpt: text("excerpt").notNull(),
  relevanceScore: varchar("relevanceScore", { length: 20 }).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["VERIFIED", "UNAVAILABLE", "ERROR", "PENDING"]).notNull(),
  retrievedAt: timestamp("retrievedAt").notNull(),
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
  evidenceId: varchar("evidenceId", { length: 100 }),
  claimId: varchar("claimId", { length: 100 }),
  claimText: text("claimText"),
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
