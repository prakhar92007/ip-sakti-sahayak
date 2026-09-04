import { ingestOfficialSource } from "../integrations/officialIngestion";
import { persistOfficialSourceStatus } from "../db";
import { officialSources, type OfficialSource } from "../integrations/sourceRegistry";
import { processQuery, type ProcessedQuery } from "./queryProcessor";
import { semanticRetrievalStatus } from "./semantic";
import type { TextChunk } from "../ingestion/chunker";

export type RetrievedChunk = { source: OfficialSource; document: { title: string; url: string; contentType: string; fetchedAt: string; sha256: string }; chunk: TextChunk; relevanceScore: number };
export type RetrievalResult = { query: ProcessedQuery; results: RetrievedChunk[]; failedSources: Array<{ sourceId: string; authority: string; officialUrl: string; jurisdiction: string; status: "UNAVAILABLE" | "ERROR"; error: string }>; stats: { sourcesSearched: number; sourcesSearchedIds: string[]; sourcesRetrieved: number; chunksRetrieved: number; documentsRetrieved: number; retrievalScores: Array<{ sourceId: string; chunkIndex: number; score: number }>; retrievalMethod: string; retrievalTimestamp: string; semanticEnabled: boolean } };

const tokenize = (text: string) => text.toLowerCase().split(/[^a-z0-9\u0900-\u097f]+/i).filter((term) => term.length > 2);

export async function retrieveOfficialEvidence(question: string, language = "en", jurisdiction?: string): Promise<RetrievalResult> {
  const retrievalTimestamp = new Date().toISOString();
  const query = processQuery(question, language);
  const requested = jurisdiction && jurisdiction !== "International" ? [jurisdiction] : query.jurisdictions;
  const selected = officialSources.filter((source) => requested.includes(source.jurisdiction) || (requested.includes("India") && source.jurisdiction === "India"));
  // The landing page is ingested for registry completeness, but its table of contents is not a substantive evidence passage.
  const searchable = selected.filter((source) => source.sourceId !== "ipindia-patent-act");
  const intentTerms: Record<string, string[]> = { patent: ["patent", "patents", "invention", "novelty", "section"], ayurveda: ["ayurveda", "ayurvedic", "herbal", "drug", "medicine"], regulation: ["regulation", "rules", "quality", "manufacture", "export"], "traditional-knowledge": ["traditional", "knowledge", "tkdl", "indigenous"] };
  const terms = Array.from(new Set([...tokenize(question), ...query.intent.flatMap((intent) => intentTerms[intent] || [])]));
  const results: RetrievedChunk[] = [];
  const failedSources: RetrievalResult["failedSources"] = [];
  for (const source of searchable) {
    try {
      const document = await ingestOfficialSource(source);
      const sourceMatches: RetrievedChunk[] = [];
      const sourceTerms = source.sourceId === "ipindia-section-3" ? Array.from(new Set([...terms, "traditional", "knowledge", "known", "components"])) : terms;
      for (const chunk of document.chunks) {
        const haystack = chunk.text.toLowerCase();
        const hits = sourceTerms.reduce((count, term) => count + (haystack.includes(term) ? 1 : 0), 0);
        if (hits > 0) {
          const sourceBoost = source.sourceId === "ipindia-section-3" && query.intent.includes("traditional-knowledge") ? 0.5 : source.sourceId === "ipindia-section-64" && query.intent.includes("patent") ? 0.3 : source.sourceId === "ipindia-guidelines" && query.intent.includes("patent") ? 0.15 : 0;
          sourceMatches.push({ source, document: { title: document.title, url: document.url, contentType: document.contentType, fetchedAt: document.fetchedAt, sha256: document.sha256 }, chunk, relevanceScore: Number((hits / Math.max(terms.length, 1) + sourceBoost).toFixed(4)) });
        }
      }
      sourceMatches.sort((a, b) => b.relevanceScore - a.relevanceScore);
      results.push(...sourceMatches.slice(0, 2));
    } catch (error) {
      source.failureReason = error instanceof Error ? error.message : String(error);
      source.status = /fetch failed|empty body|timeout|timed out|ECONN|ENOTFOUND|network/i.test(source.failureReason) ? "UNAVAILABLE" : "ERROR";
      failedSources.push({ sourceId: source.sourceId, authority: source.authority, officialUrl: source.officialUrl, jurisdiction: source.jurisdiction, status: source.status, error: source.failureReason });
      try { await persistOfficialSourceStatus(source); } catch { /* keep the retrieval response safe if status persistence is unavailable */ }
    }
  }
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const finalResults = results.slice(0, 12);
  return { query, results: finalResults, failedSources, stats: { sourcesSearched: selected.length, sourcesSearchedIds: selected.map((source) => source.sourceId), sourcesRetrieved: new Set(finalResults.map((result) => result.source.sourceId)).size, chunksRetrieved: finalResults.length, documentsRetrieved: new Set(finalResults.map((result) => result.document.sha256)).size, retrievalScores: finalResults.map((result) => ({ sourceId: result.source.sourceId, chunkIndex: result.chunk.chunkIndex, score: result.relevanceScore })), retrievalMethod: semanticRetrievalStatus.enabled ? "hybrid-keyword-semantic" : "keyword-official-corpus", retrievalTimestamp, semanticEnabled: semanticRetrievalStatus.enabled } };
}
