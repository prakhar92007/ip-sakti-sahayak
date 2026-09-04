import { createHash } from "node:crypto";

export type FetchedDocument = { url: string; contentType: string; body: Buffer; fetchedAt: string; sha256: string };

export async function fetchOfficialDocument(url: string, expectedHost?: string): Promise<FetchedDocument> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error(`Official source must use HTTPS: ${url}`);
  const response = await fetch(url, { headers: { "User-Agent": "IP-SAKTI-Sahayak/1.0 official-source-ingestion" }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Official source fetch failed (${response.status}): ${url}`);
  const finalUrl = new URL(response.url || url);
  const allowedHost = (expectedHost || parsed.hostname).toLowerCase();
  if (finalUrl.hostname.toLowerCase() !== allowedHost && !finalUrl.hostname.toLowerCase().endsWith(`.${allowedHost}`)) throw new Error(`Official source redirected to an unexpected host (${finalUrl.hostname}): ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length === 0) throw new Error(`Official source returned an empty body: ${url}`);
  const contentType = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
  const detectedType = contentType === "application/pdf" || body.subarray(0, 4).toString() === "%PDF" ? "application/pdf" : contentType === "text/html" || /<\s*(?:!doctype\s+)?html|<\s*(?:main|body|article)\b/i.test(body.toString("utf8", 0, Math.min(body.length, 4096))) ? "text/html" : contentType;
  if (detectedType !== "application/pdf" && detectedType !== "text/html") throw new Error(`Official source returned unsupported content type (${contentType || "unknown"}): ${url}`);
  return { url: finalUrl.toString(), contentType: detectedType, body, fetchedAt: new Date().toISOString(), sha256: createHash("sha256").update(body).digest("hex") };
}
