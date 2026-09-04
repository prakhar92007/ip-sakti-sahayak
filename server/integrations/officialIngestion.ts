import { extractHtml } from "../ingestion/htmlExtractor";
import { chunkText } from "../ingestion/chunker";
import { fetchOfficialDocument } from "../ingestion/documentFetcher";
import { extractPdf } from "../ingestion/pdfExtractor";
import { persistOfficialDocument, persistOfficialSourceStatus } from "../db";
import { getOfficialSource, type OfficialSource } from "./sourceRegistry";
import type { SourceDocument } from "./types";

const cache = new Map<string, SourceDocument>();

export async function ingestOfficialSource(source: OfficialSource): Promise<SourceDocument> {
  const cached = cache.get(source.sourceId);
  if (cached) return cached;
  const previousStatus = source.status;
  try {
    const fetched = await fetchOfficialDocument(source.officialUrl, new URL(source.officialUrl).hostname);
    const extracted = source.sourceType === "PDF" || fetched.contentType === "application/pdf" ? await extractPdf(fetched.body) : extractHtml(fetched.body.toString("utf8"));
    const documentTitle = extracted.title || source.title;
    const document: SourceDocument = { source, url: fetched.url, title: documentTitle, text: extracted.text, contentType: fetched.contentType, fetchedAt: fetched.fetchedAt, sha256: fetched.sha256, chunks: chunkText(extracted.text).map((chunk) => ({ ...chunk, section: source.title, page: undefined, heading: documentTitle, canonicalUrl: fetched.url, contentHash: fetched.sha256, createdAt: fetched.fetchedAt })) };
    if (!document.chunks.length) throw new Error(`No chunks extracted from ${source.officialUrl}`);
    source.status = "VERIFIED";
    source.lastVerifiedAt = fetched.fetchedAt;
    const documentId = await persistOfficialDocument({ source, document });
    if (!documentId) throw new Error(`Database unavailable; official source was not marked verified: ${source.sourceId}`);
    await persistOfficialSourceStatus(source);
    cache.set(source.sourceId, document);
    return document;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    source.status = /fetch failed|empty body|timeout|timed out|ECONN|ENOTFOUND|network/i.test(reason) ? "UNAVAILABLE" : "ERROR";
    source.failureReason = reason;
    if (source.status === "UNAVAILABLE" || previousStatus !== "VERIFIED") {
      try { await persistOfficialSourceStatus(source); } catch { /* keep the original ingestion error */ }
    }
    throw error;
  }
}

export async function ingestSourceById(sourceId: string) {
  const source = getOfficialSource(sourceId);
  if (!source) throw new Error(`Unknown official source: ${sourceId}`);
  return ingestOfficialSource(source);
}

export const clearIngestionCache = () => cache.clear();
