export type SourceStatus = "VERIFIED" | "UNAVAILABLE" | "ERROR" | "PENDING";

export type OfficialSource = {
  sourceId: string;
  authority: string;
  title: string;
  officialUrl: string;
  jurisdiction: string;
  sourceType: "HTML" | "PDF";
  language: string;
  status: SourceStatus;
  lastVerifiedAt?: string;
  failureReason?: string;
  accessMethod: "PUBLIC_HTML" | "PUBLIC_PDF";
};

// Candidate endpoints may be registered before ingestion, but remain PENDING until the real fetch,
// extraction, persistence, chunking, and validation pipeline succeeds.
export const officialSources: OfficialSource[] = [
  { sourceId: "ipindia-patent-act", authority: "IP India", title: "Patents Act 1970", officialUrl: "https://ipindia.gov.in/acts/patent-act-1970", jurisdiction: "India", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "ipindia-section-3", authority: "IP India", title: "Patents Act 1970 — Section 3: What are not inventions", officialUrl: "https://ipindia.gov.in/acts/patent-act-1970/section-3", jurisdiction: "India", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "ipindia-section-64", authority: "IP India", title: "Patents Act 1970 — Section 64: Revocation of patents", officialUrl: "https://ipindia.gov.in/acts/patent-act-1970/section-64", jurisdiction: "India", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "ipindia-guidelines", authority: "IP India", title: "Patents resources and guidelines", officialUrl: "https://ipindia.gov.in/resource/patents-resources-guidelines", jurisdiction: "India", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "ayush-drugs-rules", authority: "Ministry of AYUSH / Government of India", title: "The Drugs and Cosmetics Act and Rules", officialUrl: "https://ayush.gov.in/resources/pdf/quality_standards/Drugs-and-Cosmetics-Act-Rules.pdf", jurisdiction: "India", sourceType: "PDF", language: "en", status: "PENDING", accessMethod: "PUBLIC_PDF" },
  { sourceId: "ayush-research-portal", authority: "Ministry of AYUSH / Government of India", title: "AYUSH Research Portal", officialUrl: "https://arp.ayush.gov.in/", jurisdiction: "India", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "tkdl-portal", authority: "Traditional Knowledge Digital Library", title: "TKDL official portal", officialUrl: "https://tkdl.res.in/tkdl/langdefault/common/Home.asp?GL=Eng", jurisdiction: "India", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "wipo-lex", authority: "WIPO / WIPO Lex", title: "WIPO Lex legal information", officialUrl: "https://www.wipo.int/en/web/wipolex/index", jurisdiction: "International", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "uspto-patents", authority: "United States Patent and Trademark Office", title: "USPTO patents", officialUrl: "https://www.uspto.gov/patents", jurisdiction: "United States", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "fda-drugs", authority: "U.S. Food and Drug Administration", title: "FDA drugs and regulatory information", officialUrl: "https://www.fda.gov/drugs", jurisdiction: "United States", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "ec-cosmetics", authority: "European Commission", title: "EU cosmetics regulatory framework", officialUrl: "https://single-market-economy.ec.europa.eu/sectors/cosmetics_en", jurisdiction: "European Union", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "ema-herbal", authority: "European Medicines Agency (EMA)", title: "Herbal medicinal products", officialUrl: "https://www.ema.europa.eu/en/human-regulatory-overview/herbal-medicinal-products", jurisdiction: "European Union", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "eur-lex", authority: "EUR-Lex / European Union", title: "Access to European Union law", officialUrl: "https://eur-lex.europa.eu/", jurisdiction: "European Union", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
];

export const getOfficialSource = (sourceId: string) => officialSources.find((source) => source.sourceId === sourceId);
export const verifiedOfficialSources = () => officialSources.filter((source) => source.status === "VERIFIED");
