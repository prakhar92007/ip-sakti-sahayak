export type EmbeddingVector = number[];

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimensions?: number;
  embed(text: string): Promise<EmbeddingVector>;
}

export type VectorRecord = {
  id: string;
  text: string;
  metadata: Record<string, string | number | undefined>;
  vector: EmbeddingVector;
};

export interface VectorStore {
  readonly name: string;
  upsert(records: VectorRecord[]): Promise<void>;
  search(vector: EmbeddingVector, limit: number, filters?: Record<string, string>): Promise<VectorRecord[]>;
}

/** No fake vectors are generated. This adapter makes the unavailable capability explicit. */
export class UnconfiguredEmbeddingProvider implements EmbeddingProvider {
  readonly name = "unconfigured";
  async embed(_text: string): Promise<EmbeddingVector> {
    throw new Error("No embedding provider is configured; semantic retrieval is disabled");
  }
}

export class UnconfiguredVectorStore implements VectorStore {
  readonly name = "unconfigured";
  async upsert(_records: VectorRecord[]): Promise<void> {
    throw new Error("No vector store is configured; semantic retrieval is disabled");
  }
  async search(_vector: EmbeddingVector, _limit: number, _filters?: Record<string, string>): Promise<VectorRecord[]> {
    throw new Error("No vector store is configured; semantic retrieval is disabled");
  }
}

export type SemanticRetrievalStatus = {
  enabled: false;
  embeddingProvider: string;
  vectorStore: string;
  reason: string;
};

export const semanticRetrievalStatus: SemanticRetrievalStatus = {
  enabled: false,
  embeddingProvider: "none configured",
  vectorStore: "none configured",
  reason: "The current environment exposes the built-in LLM gateway but no embedding/vector provider. Keyword retrieval remains active; no fake embeddings are used.",
};
