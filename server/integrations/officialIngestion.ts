import { extractHtml } from "../ingestion/htmlExtractor";
import { chunkText } from "../ingestion/chunker";
import { fetchOfficialDocument } from "../ingestion/documentFetcher";
import { extractPdf } from "../ingestion/pdfExtractor";
import { persistOfficialDocument } from "../db";
import { getOfficialSource, type OfficialSource } from "./sourceRegistry";
import type { SourceDocument } from "./types";

const cache = new Map<string, SourceDocument>();

export async function ingestOfficialSource(source: OfficialSource): Promise<SourceDocument> {
  const cached = cache.get(source.sourceId);
  if (cached) return cached;
  const fetched = await fetchOfficialDocument(source.officialUrl);
  const extracted = source.sourceType === "PDF" || fetched.contentType === "application/pdf" ? await extractPdf(fetched.body) : extractHtml(fetched.body.toString("utf8"));
  const document: SourceDocument = { source, url: fetched.url, title: extracted.title || source.title, text: extracted.text, contentType: fetched.contentType, fetchedAt: fetched.fetchedAt, sha256: fetched.sha256, chunks: chunkText(extracted.text) };
  if (!document.chunks.length) throw new Error(`No chunks extracted from ${source.officialUrl}`);
  source.status = "VERIFIED";
  source.lastVerifiedAt = fetched.fetchedAt;
  const documentId = await persistOfficialDocument({ source, document });
  if (!documentId) throw new Error(`Database unavailable; official source was not marked verified: ${source.sourceId}`);
  cache.set(source.sourceId, document);
  return document;
}

export async function ingestSourceById(sourceId: string) {
  const source = getOfficialSource(sourceId);
  if (!source) throw new Error(`Unknown official source: ${sourceId}`);
  return ingestOfficialSource(source);
}

export const clearIngestionCache = () => cache.clear();
