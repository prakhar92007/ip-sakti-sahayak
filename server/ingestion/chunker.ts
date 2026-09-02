export type TextChunk = { chunkIndex: number; text: string; startOffset: number; endOffset: number };

export function chunkText(text: string, size = 1200, overlap = 180): TextChunk[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const chunks: TextChunk[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + size);
    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push({ chunkIndex: chunks.length, text: chunk, startOffset: start, endOffset: end });
    if (end >= normalized.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
}
