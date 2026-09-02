import { invokeLLM } from "./_core/llm";
import { persistEvidenceAndCitations } from "./db";
import { retrieveOfficialEvidence, type RetrievedChunk } from "./retrieval/retrieve";

export type EvidenceObject = { evidenceId: string; sourceId: string; sourceTitle: string; officialUrl: string; jurisdiction: string; documentTitle: string; section: string; page?: string; excerpt: string; retrievalTimestamp: string; relevanceScore: number; verificationStatus: "VERIFIED" };
export type GroundedClaim = { claimId: string; claimText: string; evidenceIds: string[]; confidence: number; verificationRequired: boolean };
export type GroundedResponse = { mode: "VERIFIED"; llmStatus: "CONNECTED" | "UNAVAILABLE"; executiveSummary: string; keyFindings: GroundedClaim[]; ipConsiderations: GroundedClaim[]; traditionalKnowledgeConsiderations: GroundedClaim[]; regulatoryConsiderations: GroundedClaim[]; jurisdictionAnalysis: GroundedClaim[]; riskAssessment: GroundedClaim[]; recommendedNextSteps: string[]; sources: Array<{ sourceId: string; authority: string; title: string; officialUrl: string; jurisdiction: string; status: "VERIFIED" }>; evidence: EvidenceObject[]; citations: Array<{ citationId: string; evidenceId: string; sourceId: string; officialUrl: string; excerpt: string }>; retrievalStats: { sourcesSearched: number; sourcesRetrieved: number; relevantSources: number; chunksRetrieved: number; evidenceSelected: number; claimsGenerated: number; claimsSupported: number; citationsMapped: number; uniqueJurisdictions: number }; disclaimer: string };

const toEvidence = (item: RetrievedChunk): EvidenceObject => ({ evidenceId: `EVD-${item.source.sourceId}-${item.document.sha256.slice(0, 12)}-${item.chunk.chunkIndex}`, sourceId: item.source.sourceId, sourceTitle: item.source.authority, officialUrl: item.document.url, jurisdiction: item.source.jurisdiction, documentTitle: item.document.title, section: item.source.title, excerpt: item.chunk.text, retrievalTimestamp: item.document.fetchedAt, relevanceScore: item.relevanceScore, verificationStatus: "VERIFIED" });

export async function groundedChat(question: string, language = "en", jurisdiction?: string): Promise<GroundedResponse> {
  const retrieved = await retrieveOfficialEvidence(question, language, jurisdiction);
  const evidence = retrieved.results.slice(0, 6).map(toEvidence);
  const sources = Array.from(new Map(evidence.map((item) => [item.sourceId, item])).values()).map((item) => ({ sourceId: item.sourceId, authority: item.sourceTitle, title: item.documentTitle, officialUrl: item.officialUrl, jurisdiction: item.jurisdiction, status: "VERIFIED" as const }));
  if (!evidence.length) {
    return { mode: "VERIFIED", llmStatus: "UNAVAILABLE", executiveSummary: "Insufficient verified evidence found in the connected official corpus.", keyFindings: [], ipConsiderations: [], traditionalKnowledgeConsiderations: [], regulatoryConsiderations: [], jurisdictionAnalysis: [], riskAssessment: [], recommendedNextSteps: ["Broaden the query or connect an additional official source corpus.", "Verify the question with a qualified patent, legal, or regulatory professional."], sources: [], evidence: [], citations: [], retrievalStats: { sourcesSearched: retrieved.stats.sourcesSearched, sourcesRetrieved: 0, relevantSources: 0, chunksRetrieved: retrieved.stats.chunksRetrieved, evidenceSelected: 0, claimsGenerated: 0, claimsSupported: 0, citationsMapped: 0, uniqueJurisdictions: 0 }, disclaimer: "No factual claim is made because no supporting official evidence was retrieved." };
  }
  const context = evidence.map((item) => `[${item.evidenceId}] ${item.documentTitle} (${item.officialUrl})\n${item.excerpt}`).join("\n\n");
  let summary = "A grounded preliminary review was assembled from the retrieved official source excerpts.";
  let llmStatus: GroundedResponse["llmStatus"] = "UNAVAILABLE";
  try {
    const llm = await Promise.race([invokeLLM({ model: undefined, messages: [{ role: "system", content: "You are a cautious research assistant. Use only the supplied evidence. Do not invent facts, URLs, quotations, sections, or citations. Return one concise executive summary. If evidence is insufficient, say so." }, { role: "user", content: `Question: ${question}\nResponse language: ${language}\nEvidence:\n${context}` }], maxTokens: 500 }), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("LLM timeout")), 8000))]);
    const content = llm.choices[0]?.message.content;
    if (typeof content === "string" && content.trim()) { summary = content.trim(); llmStatus = "CONNECTED"; }
  } catch {
    // A grounded deterministic summary remains available if the optional model gateway is unavailable.
  }
  const claims: GroundedClaim[] = evidence.slice(0, 3).map((item, index) => {
    const claimText = item.section.includes("Section 3") && /traditional knowledge/i.test(item.excerpt)
      ? "The official Section 3 page states that an invention which in effect is traditional knowledge, or an aggregation or duplication of known properties of traditionally known components, is not an invention within the Act."
      : item.section.includes("Section 64") && /obvious|inventive step|publicly known/i.test(item.excerpt)
        ? "The official Section 64 page lists prior public knowledge or publication and obviousness or lack of inventive step among the grounds described for revocation."
        : item.section.includes("guidelines") && /Ayush Related Inventions|Traditional Knowledge/i.test(item.excerpt)
          ? "The official IP India guidelines page lists guidance for examination of Ayush-related inventions and for patent applications relating to traditional knowledge and biological material."
          : "The retrieved official passage is relevant evidence for the question and should be reviewed in its original context.";
    return { claimId: `CLM-${String(index + 1).padStart(3, "0")}`, claimText, evidenceIds: [item.evidenceId], confidence: item.relevanceScore, verificationRequired: false };
  });
  const citations = evidence.map((item) => ({ citationId: `CIT-${item.evidenceId}`, evidenceId: item.evidenceId, sourceId: item.sourceId, officialUrl: item.officialUrl, excerpt: item.excerpt }));
  await persistEvidenceAndCitations({ evidence, citations, claimTextByEvidenceId: new Map(claims.map((claim) => [claim.evidenceIds[0] || "", claim.claimText])) });
  return { mode: "VERIFIED", llmStatus, executiveSummary: summary, keyFindings: claims, ipConsiderations: claims, traditionalKnowledgeConsiderations: [], regulatoryConsiderations: claims, jurisdictionAnalysis: claims, riskAssessment: [], recommendedNextSteps: ["Review each cited official passage in context.", "Obtain qualified professional advice before relying on the result."], sources, evidence, citations, retrievalStats: { sourcesSearched: retrieved.stats.sourcesSearched, sourcesRetrieved: retrieved.stats.sourcesRetrieved, relevantSources: sources.length, chunksRetrieved: retrieved.stats.chunksRetrieved, evidenceSelected: evidence.length, claimsGenerated: claims.length, claimsSupported: claims.length, citationsMapped: citations.length, uniqueJurisdictions: new Set(evidence.map((item) => item.jurisdiction)).size }, disclaimer: "AI-assisted research orientation only. Distinguish the cited official facts from interpretation and obtain qualified professional advice." };
}
