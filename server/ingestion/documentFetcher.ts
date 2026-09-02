import { createHash } from "node:crypto";

export type FetchedDocument = { url: string; contentType: string; body: Buffer; fetchedAt: string; sha256: string };

export async function fetchOfficialDocument(url: string): Promise<FetchedDocument> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error(`Official source must use HTTPS: ${url}`);
  const response = await fetch(url, { headers: { "User-Agent": "IP-SAKTI-Sahayak/1.0 official-source-ingestion" } });
  if (!response.ok) throw new Error(`Official source fetch failed (${response.status}): ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length === 0) throw new Error(`Official source returned an empty body: ${url}`);
  const contentType = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
  return { url, contentType, body, fetchedAt: new Date().toISOString(), sha256: createHash("sha256").update(body).digest("hex") };
}
