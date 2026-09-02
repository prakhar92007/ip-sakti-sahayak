export type ExtractedText = { title: string; text: string; documentType: "HTML" };

export function extractHtml(html: string): ExtractedText {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() || "Official HTML document";
  const sectionBody = html.match(/<div[^>]+id=["']sectionBody["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  const chapterDetails = html.match(/<div[^>]+class=["']chapterDetailsAreaBox["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  const table = html.match(/<table[\s\S]*?<\/table>/i)?.[0];
  const content = sectionBody || chapterDetails || (table && table.length > 200 ? table : html);
  const text = content
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&zwj;|&#8205;/gi, "")
    .replace(/\u200d/g, "")
    .replace(/-->/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length < 80) throw new Error("Official HTML document has no meaningful extracted text");
  return { title, text, documentType: "HTML" };
}
