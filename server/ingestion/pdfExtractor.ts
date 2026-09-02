import { PDFParse } from "pdf-parse";

export type ExtractedPdf = { title: string; text: string; documentType: "PDF" };

export async function extractPdf(buffer: Buffer): Promise<ExtractedPdf> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  const text = (result.text || "").replace(/\s+/g, " ").trim();
  if (text.length < 80) throw new Error("Official PDF has no meaningful extractable text");
  const title = text.match(/(?:THE |GOVERNMENT OF |MINISTRY OF )[^.]{8,160}/i)?.[0]?.trim() || "Official PDF document";
  return { title, text, documentType: "PDF" };
}
