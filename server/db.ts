import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, sources, documents, documentChunks, evidence, citations } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function persistOfficialDocument(input: {
  source: { sourceId: string; authority: string; title: string; officialUrl: string; jurisdiction: string; sourceType: string; language: string; status: "VERIFIED" | "UNAVAILABLE" | "ERROR" | "PENDING"; lastVerifiedAt?: string };
  document: { title: string; contentType: string; text: string; sha256: string; fetchedAt: string; chunks: Array<{ chunkIndex: number; text: string; startOffset: number; endOffset: number }> };
}) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select({ id: documents.id }).from(documents).where(eq(documents.contentHash, input.document.sha256)).limit(1);
  if (existing[0]?.id) return existing[0].id;
  await db.insert(sources).values({ id: input.source.sourceId, name: input.source.authority, title: input.source.title, publisher: input.source.authority, jurisdiction: input.source.jurisdiction, category: "Official source", status: input.source.status, officialUrl: input.source.officialUrl, sourceType: input.source.sourceType, language: input.source.language, accessMethod: "PUBLIC", lastVerifiedAt: input.source.lastVerifiedAt ? new Date(input.source.lastVerifiedAt) : null, contentHash: input.document.sha256, documentCount: 1 }).onDuplicateKeyUpdate({ set: { status: input.source.status, officialUrl: input.source.officialUrl, lastVerifiedAt: input.source.lastVerifiedAt ? new Date(input.source.lastVerifiedAt) : null, contentHash: input.document.sha256, documentCount: 1 } });
  const inserted = await db.insert(documents).values({ sourceId: input.source.sourceId, title: input.document.title, documentType: input.document.contentType === "application/pdf" ? "PDF" : "HTML", sourceUrl: input.document.title ? input.source.officialUrl : null, retrievedAt: new Date(input.document.fetchedAt), chunkCount: input.document.chunks.length, contentType: input.document.contentType, extractedText: input.document.text, contentHash: input.document.sha256, status: "VERIFIED" }).$returningId();
  const documentId = inserted[0]?.id;
  if (documentId) await db.insert(documentChunks).values(input.document.chunks.map((chunk) => ({ documentId, chunkIndex: chunk.chunkIndex, text: chunk.text, startOffset: chunk.startOffset, endOffset: chunk.endOffset })));
  return documentId;
}

export async function persistOfficialSourceStatus(source: {
  sourceId: string;
  authority: string;
  title: string;
  officialUrl: string;
  jurisdiction: string;
  sourceType: string;
  language: string;
  accessMethod: string;
  status: "VERIFIED" | "UNAVAILABLE" | "ERROR" | "PENDING";
  lastVerifiedAt?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(sources).values({ id: source.sourceId, name: source.authority, title: source.title, publisher: source.authority, jurisdiction: source.jurisdiction, category: "Official source", status: source.status, officialUrl: source.officialUrl, sourceType: source.sourceType, language: source.language, accessMethod: source.accessMethod, lastVerifiedAt: source.lastVerifiedAt ? new Date(source.lastVerifiedAt) : null }).onDuplicateKeyUpdate({ set: { status: source.status, officialUrl: source.officialUrl, sourceType: source.sourceType, language: source.language, accessMethod: source.accessMethod, lastVerifiedAt: source.lastVerifiedAt ? new Date(source.lastVerifiedAt) : null } });
}

export async function persistEvidenceAndCitations(input: {
  evidence: Array<{ evidenceId: string; sourceId: string; officialUrl: string; section: string; excerpt: string; relevanceScore: number; verificationStatus: "VERIFIED"; retrievalTimestamp: string }>;
  citations: Array<{ citationId: string; evidenceId: string; sourceId: string; officialUrl: string; excerpt: string }>;
  claimTextByEvidenceId: Map<string, string>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable; evidence was not persisted");
  if (input.evidence.length) await db.insert(evidence).values(input.evidence.map((item) => ({ evidenceId: item.evidenceId, sourceId: item.sourceId, officialUrl: item.officialUrl, section: item.section, excerpt: item.excerpt, relevanceScore: String(item.relevanceScore), verificationStatus: item.verificationStatus, retrievedAt: new Date(item.retrievalTimestamp) }))).onDuplicateKeyUpdate({ set: { excerpt: sql`VALUES(${evidence.excerpt})`, relevanceScore: sql`VALUES(${evidence.relevanceScore})`, retrievedAt: sql`VALUES(${evidence.retrievedAt})` } });
  if (input.citations.length) await db.insert(citations).values(input.citations.map((item) => ({ citationId: item.citationId, evidenceId: item.evidenceId, documentId: null, sourceId: item.sourceId, section: null, excerpt: item.excerpt, relevanceScore: null, retrievedAt: new Date(), claimText: input.claimTextByEvidenceId.get(item.evidenceId) || null })));
}

export async function listPersistedOfficialSources() {
  const db = await getDb();
  return db ? db.select().from(sources) : [];
}

// TODO: add feature queries here as your schema grows.
