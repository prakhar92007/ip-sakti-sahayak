/**
 * IP-SAKTI Sahayak demo RAG layer.
 *
 * These contracts intentionally separate retrieval, ranking, citation tracing,
 * translation and domain services from the UI. Replace the demo implementations
 * with permitted source connectors, embeddings, a vector store and an LLM later.
 */

export type Risk = "Low" | "Medium" | "High";

export type SourceRecord = {
  id: string;
  name: string;
  title: string;
  publisher: string;
  jurisdiction: string;
  category: string;
  status: "DEMO SOURCE" | "VERIFIED SOURCE";
  indexedAt: string;
  documentCount: number;
};

export type Citation = SourceRecord & {
  citationId: string;
  section: string;
  excerpt: string;
  relevanceScore: number;
};

export type ChatRequest = {
  question: string;
  language?: string;
  jurisdiction?: string;
  productType?: string;
};

export type ChatResponse = {
  mode: "DEMO MODE" | "VERIFIED MODE";
  answer: string;
  findings: string[];
  jurisdiction: string;
  risk: Risk;
  nextSteps: string[];
  citations: Citation[];
};

export interface VectorDatabaseAdapter {
  upsert(chunks: Array<{ id: string; text: string; metadata: Record<string, string> }>): Promise<void>;
  search(query: string, filters?: Record<string, string>): Promise<Array<{ chunkId: string; score: number; text: string; metadata: Record<string, string> }>>;
}

export interface EmbeddingService {
  embed(texts: string[]): Promise<number[][]>;
}

export interface LLMService {
  answer(input: { question: string; context: string; language: string }): Promise<string>;
}

export interface CitationService {
  trace(answer: string, evidence: Citation[]): Promise<Citation[]>;
}

export interface TranslationService {
  translate(text: string, targetLanguage: string): Promise<string>;
}

export interface DocumentService {
  ingest(document: { title: string; publisher: string; jurisdiction: string; text: string }): Promise<{ documentId: string; chunkCount: number }>;
}

export interface RetrievalService {
  retrieve(query: string, filters?: Record<string, string>): Promise<Citation[]>;
}

export const demoSources: SourceRecord[] = [
  { id: "ipo", name: "Indian Patent Office", title: "Patents and traditional knowledge: preliminary research context", publisher: "Controller General of Patents, Designs & Trade Marks", jurisdiction: "India", category: "Patent practice", status: "DEMO SOURCE", indexedAt: "2026-09-02T00:00:00.000Z", documentCount: 248 },
  { id: "wipo", name: "WIPO Lex", title: "Traditional knowledge and intellectual property reference", publisher: "World Intellectual Property Organization", jurisdiction: "International", category: "Global IP", status: "DEMO SOURCE", indexedAt: "2026-09-02T00:00:00.000Z", documentCount: 1126 },
  { id: "tkdl", name: "TKDL", title: "Traditional Knowledge Digital Library context record", publisher: "CSIR / Ministry of AYUSH", jurisdiction: "India", category: "Traditional knowledge", status: "DEMO SOURCE", indexedAt: "2026-09-02T00:00:00.000Z", documentCount: 18540 },
  { id: "ayush", name: "Ministry of AYUSH", title: "Ayurveda product pathway reference", publisher: "Ministry of AYUSH", jurisdiction: "India", category: "Regulatory", status: "DEMO SOURCE", indexedAt: "2026-09-02T00:00:00.000Z", documentCount: 96 },
  { id: "fda", name: "FDA resources", title: "US market pathway context for wellness products", publisher: "U.S. Food and Drug Administration", jurisdiction: "United States", category: "Regulatory", status: "DEMO SOURCE", indexedAt: "2026-09-02T00:00:00.000Z", documentCount: 312 },
  { id: "dshea", name: "DSHEA resources", title: "US dietary supplement framework context", publisher: "US regulatory reference set", jurisdiction: "United States", category: "Regulatory", status: "DEMO SOURCE", indexedAt: "2026-09-02T00:00:00.000Z", documentCount: 184 },
  { id: "eu", name: "EU regulatory resources", title: "European market classification context", publisher: "European Union resources", jurisdiction: "European Union", category: "Regulatory", status: "DEMO SOURCE", indexedAt: "2026-09-02T00:00:00.000Z", documentCount: 407 },
];

function toCitation(source: SourceRecord, relevanceScore: number): Citation {
  return {
    ...source,
    citationId: `IP-SAKTI-${source.id.toUpperCase()}-024`,
    section: "Illustrative section / demo record",
    excerpt: "This demo excerpt represents the type of primary source passage a connected corpus would return. Replace with a verified document before relying on this guidance.",
    relevanceScore,
  };
}

export function listSources() {
  return demoSources;
}

export function getSource(id: string) {
  return demoSources.find((source) => source.id === id);
}

export async function retrieveDemoEvidence(query: string, jurisdiction = "India") {
  const preferred = jurisdiction === "India" ? [demoSources[0], demoSources[2], demoSources[1], demoSources[3], demoSources[4], demoSources[6], demoSources[5]] : jurisdiction === "United States" ? [demoSources[4], demoSources[6], demoSources[1], demoSources[0], demoSources[5], demoSources[3], demoSources[2]] : [demoSources[1], demoSources[5], demoSources[4], demoSources[0], demoSources[2], demoSources[3], demoSources[6]];
  return preferred.map((source, index) => toCitation(source, 0.94 - index * 0.035));
}

export async function demoChat(input: ChatRequest): Promise<ChatResponse> {
  const jurisdiction = input.jurisdiction || "India";
  const citations = await retrieveDemoEvidence(input.question, jurisdiction);
  return {
    mode: "DEMO MODE",
    answer: "A preliminary review is needed before reaching a conclusion. Novelty, inventive step, disclosure quality and any traditional-knowledge overlap should be assessed against the relevant jurisdiction and current sources.",
    findings: [
      "The formulation may need a structured novelty and prior-art review.",
      "Traditional-use overlap can be a material risk signal and should be documented carefully.",
      "A patent professional should validate claim strategy, evidence and jurisdiction-specific requirements.",
    ],
    jurisdiction,
    risk: "Medium",
    nextSteps: [
      "Record the complete ingredients, proportions and manufacturing process.",
      "Run a source-backed prior-art and traditional-knowledge screening.",
      "Take the evidence pack to a qualified patent professional for an opinion.",
    ],
    citations,
  };
}

export type ScreeningRequest = {
  productName: string;
  ingredients: string;
  intendedUse: string;
  manufacturingProcess: string;
  existingTraditionalUse: string;
  targetMarket: string;
  additionalInformation?: string;
};

export async function demoScreening(input: ScreeningRequest) {
  const citations = await retrieveDemoEvidence(`${input.productName} ${input.ingredients}`, input.targetMarket);
  return {
    mode: "DEMO MODE" as const,
    overallSignal: "Moderate",
    patentability: "Further review required",
    priorArt: "Potentially relevant material found",
    traditionalKnowledge: "Potential risk",
    gi: "Review recommended",
    regulatory: "Market-specific review required",
    riskScore: 58,
    citations,
    disclaimer: "This is an AI-assisted preliminary screening and is not a legal opinion.",
  };
}

export async function demoRegulatoryPathway(productType: string, targetMarket: string) {
  return {
    mode: "DEMO MODE" as const,
    productType,
    targetMarket,
    stages: [
      { title: "Product classification", status: "Start here", requirement: "Define product category, intended use and claims" },
      { title: "Applicable authority", status: "Demo mapping", requirement: `Map the responsible authority for ${targetMarket}` },
      { title: "Documentation", status: "Prepare", requirement: "Assemble formula, manufacturing, label and quality records" },
      { title: "Evidence / testing", status: "Confirm", requirement: "Validate safety and quality evidence for the chosen route" },
      { title: "Registration / notification", status: "Later", requirement: "Complete the current market-specific administrative pathway" },
      { title: "Market entry", status: "Later", requirement: "Launch with label, claims and regulatory update monitoring" },
    ],
    disclaimer: "Demo pathway only. Confirm requirements against current official guidance and professional advice.",
  };
}

export async function demoCompare(leftMarket: string, rightMarket: string) {
  return {
    mode: "DEMO MODE" as const,
    markets: [leftMarket, rightMarket],
    dimensions: ["Product classification", "Regulatory authority", "Registration pathway", "Evidence requirements", "Traditional knowledge considerations", "Labeling", "IP considerations"],
    disclaimer: "Demo comparison data is intentionally general and must be verified by jurisdiction.",
  };
}
