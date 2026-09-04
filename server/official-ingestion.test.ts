import { describe, expect, it } from "vitest";
import { extractHtml } from "./ingestion/htmlExtractor";
import { officialSources } from "./integrations/sourceRegistry";

describe("official ingestion guardrails", () => {
  it("extracts the substantive IP India section body and removes navigation noise", () => {
    const extracted = extractHtml(`
      <html><head><title>Official Section</title></head><body>
        <nav>Home About Us Main Menu</nav>
        <div class="chapterHeadinBox">SECTION 3</div>
        <div class="chapterDetailsAreaBox"><div class="section-body" id="sectionBody">
          <p>(p) an invention which in effect, is traditional knowledge or an aggregation of known properties.</p>
        </div></div>
      </body></html>`);
    expect(extracted.text).toContain("traditional knowledge");
    expect(extracted.text).not.toContain("Main Menu");
  });

  it("registers international candidates without treating them as verified", () => {
    const candidates = officialSources.filter((source) => /TKDL|WIPO|USPTO|FDA|European Commission|EMA|EUR-Lex/i.test(`${source.authority} ${source.title}`));
    expect(candidates.length).toBeGreaterThanOrEqual(7);
    expect(candidates.every((source) => source.status === "PENDING")).toBe(true);
  });
});
