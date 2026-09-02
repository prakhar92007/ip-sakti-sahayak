import type { OfficialSource } from "./sourceRegistry";

export type SourceResult = { source: OfficialSource; url: string; title: string };
export type SourceDocument = { source: OfficialSource; url: string; title: string; text: string; contentType: string; fetchedAt: string; sha256: string; chunks: Array<{ chunkIndex: number; text: string; startOffset: number; endOffset: number }> };

export interface OfficialSourceAdapter {
  sourceId: string;
  organization: string;
  jurisdiction: string;
  search(query: string): Promise<SourceResult[]>;
  fetchDocument(url: string): Promise<SourceDocument>;
}
