import { ingestOfficialSource } from "../integrations/officialIngestion";
import { persistOfficialSourceStatus } from "../db";
import { officialSources, type OfficialSource } from "../integrations/sourceRegistry";
import { processQuery, type ProcessedQuery } from "./queryProcessor";

export type RetrievedChunk = { source: OfficialSource; document: { title: string; url: string; contentType: string; fetchedAt: string; sha256: string }; chunk: { chunkIndex: number; text: string; startOffset: number; endOffset: number }; relevanceScore: number };
export type RetrievalResult = { query: ProcessedQuery; results: RetrievedChunk[]; failedSources: Array<{ sourceId: string; error: string }>; stats: { sourcesSearched: number; sourcesRetrieved: number; chunksRetrieved: number } };

const tokenize = (text: string) => text.toLowerCase().split(/[^a-z0-9\u0900-\u097f]+/i).filter((term) => term.length > 2);

export async function retrieveOfficialEvidence(question: string, language = "en", jurisdiction?: string): Promise<RetrievalResult> {
  const query = processQuery(question, language);
  const requested = jurisdiction && jurisdiction !== "International" ? [jurisdiction] : query.jurisdictions;
  const selected = officialSources.filter((source) => requested.includes(source.jurisdiction) || (requested.includes("India") && source.jurisdiction === "India"));
  // The landing page is ingested for registry completeness, but its table of contents is not a substantive evidence passage.
  const searchable = selected.filter((source) => source.sourceId !== "ipindia-patent-act");
  const intentTerms: Record<string, string[]> = { patent: ["patent", "patents", "invention", "novelty", "section"], ayurveda: ["ayurveda", "ayurvedic", "herbal", "drug", "medicine"], regulation: ["regulation", "rules", "quality", "manufacture", "export"], "traditional-knowledge": ["traditional", "knowledge", "tkdl", "indigenous"] };
  const terms = Array.from(new Set([...tokenize(question), ...query.intent.flatMap((intent) => intentTerms[intent] || [])]));
  const results: RetrievedChunk[] = [];
  const failedSources: Array<{ sourceId: string; error: string }> = [];
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
      source.status = "UNAVAILABLE";
      failedSources.push({ sourceId: source.sourceId, error: error instanceof Error ? error.message : String(error) });
      try { await persistOfficialSourceStatus(source); } catch { /* keep the retrieval response safe if status persistence is unavailable */ }
    }
  }
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return { query, results: results.slice(0, 12), failedSources, stats: { sourcesSearched: selected.length, sourcesRetrieved: new Set(results.map((result) => result.source.sourceId)).size, chunksRetrieved: results.length } };
}
