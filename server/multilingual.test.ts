import { describe, expect, it } from "vitest";
import { getLanguagePack, languageMatrix } from "../client/src/i18n";

describe("IP-SAKTI multilingual demo matrix", () => {
  it("covers English and all seven supported Indian languages", () => {
    expect(languageMatrix).toEqual(["en", "hi", "mr", "gu", "ta", "te", "kn", "bn"]);
    for (const language of languageMatrix) {
      const pack = getLanguagePack(language);
      expect(pack.suggestions).toHaveLength(6);
      expect(pack.stages).toHaveLength(5);
      expect(pack.chat.greeting.length).toBeGreaterThan(10);
      expect(pack.chat.disclaimer.length).toBeGreaterThan(10);
      expect(pack.nav.reports.length).toBeGreaterThan(0);
    }
  });

  it("keeps source language separate from response language", () => {
    const hindi = getLanguagePack("hi");
    expect(hindi.chat.responseLanguage).toContain("उत्तर");
    expect(hindi.chat.originalLanguage).toContain("मूल");
  });
});
