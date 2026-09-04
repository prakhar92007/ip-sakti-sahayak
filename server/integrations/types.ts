import type { OfficialSource } from "./sourceRegistry";
import type { TextChunk } from "../ingestion/chunker";

export type SourceResult = { source: OfficialSource; url: string; title: string };
export type SourceDocument = { source: OfficialSource; url: string; title: string; text: string; contentType: string; fetchedAt: string; sha256: string; chunks: TextChunk[] };

export interface OfficialSourceAdapter {
  sourceId: string;
  organization: string;
  jurisdiction: string;
  search(query: string): Promise<SourceResult[]>;
  fetchDocument(url: string): Promise<SourceDocument>;
}
