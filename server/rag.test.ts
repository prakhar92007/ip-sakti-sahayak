import { describe, expect, it } from "vitest";
import { demoChat, demoRegulatoryPathway, demoScreening, getSource, listSources } from "./rag";

describe("IP-SAKTI demo RAG services", () => {
  it("exposes clearly labeled demo sources with citation metadata available", () => {
    const records = listSources();
    expect(records.length).toBeGreaterThanOrEqual(7);
    expect(records.every((source) => source.status === "DEMO SOURCE")).toBe(true);
    expect(getSource("tkdl")?.jurisdiction).toBe("India");
    expect(getSource("dshea")?.jurisdiction).toBe("United States");
  });

  it("returns a source-cited preliminary chat response", async () => {
    const response = await demoChat({ question: "Can I patent this Ayurvedic formulation?", jurisdiction: "India" });
    expect(response.mode).toBe("DEMO MODE");
    expect(response.risk).toBe("Medium");
    expect(response.citations.length).toBe(7);
    expect(response.citations[0]?.citationId).toContain("IP-SAKTI");
    expect(response.citations[0]?.excerpt).toContain("demo");
  });

  it("returns screening signals and a professional-review disclaimer", async () => {
    const result = await demoScreening({
      productName: "NiraBalance",
      ingredients: "Ashwagandha, tulsi",
      intendedUse: "Wellness",
      manufacturingProcess: "Aqueous extraction",
      existingTraditionalUse: "Traditional-use context supplied by user",
      targetMarket: "India",
    });
    expect(result.overallSignal).toBe("Moderate");
    expect(result.traditionalKnowledge).toBe("Potential risk");
    expect(result.disclaimer).toContain("not a legal opinion");
  });

  it("builds a six-stage regulatory pathway for the selected market", async () => {
    const result = await demoRegulatoryPathway("Herbal formulation", "European Union");
    expect(result.mode).toBe("DEMO MODE");
    expect(result.stages).toHaveLength(6);
    expect(result.stages[1]?.requirement).toContain("European Union");
  });
});
