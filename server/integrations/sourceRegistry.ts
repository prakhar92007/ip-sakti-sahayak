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
  accessMethod: "PUBLIC_HTML" | "PUBLIC_PDF";
};

// Only endpoints verified as official, reachable, and relevant during Phase 2/3 validation are listed.
// TKDL, WIPO, USPTO, FDA, European Commission, EMA, and EUR-Lex remain intentionally absent until separately validated.
export const officialSources: OfficialSource[] = [
  { sourceId: "ipindia-patent-act", authority: "IP India", title: "Patents Act 1970", officialUrl: "https://ipindia.gov.in/acts/patent-act-1970", jurisdiction: "India", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "ipindia-section-3", authority: "IP India", title: "Patents Act 1970 — Section 3: What are not inventions", officialUrl: "https://ipindia.gov.in/acts/patent-act-1970/section-3", jurisdiction: "India", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "ipindia-section-64", authority: "IP India", title: "Patents Act 1970 — Section 64: Revocation of patents", officialUrl: "https://ipindia.gov.in/acts/patent-act-1970/section-64", jurisdiction: "India", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "ipindia-guidelines", authority: "IP India", title: "Patents resources and guidelines", officialUrl: "https://ipindia.gov.in/resource/patents-resources-guidelines", jurisdiction: "India", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
  { sourceId: "ayush-drugs-rules", authority: "Ministry of AYUSH / Government of India", title: "The Drugs and Cosmetics Act and Rules", officialUrl: "https://ayush.gov.in/resources/pdf/quality_standards/Drugs-and-Cosmetics-Act-Rules.pdf", jurisdiction: "India", sourceType: "PDF", language: "en", status: "PENDING", accessMethod: "PUBLIC_PDF" },
  { sourceId: "ayush-research-portal", authority: "Ministry of AYUSH / Government of India", title: "AYUSH Research Portal", officialUrl: "https://arp.ayush.gov.in/", jurisdiction: "India", sourceType: "HTML", language: "en", status: "PENDING", accessMethod: "PUBLIC_HTML" },
];

export const getOfficialSource = (sourceId: string) => officialSources.find((source) => source.sourceId === sourceId);
export const verifiedOfficialSources = () => officialSources.filter((source) => source.status === "VERIFIED");
