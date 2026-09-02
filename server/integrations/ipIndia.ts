import { ingestOfficialSource } from "./officialIngestion";
import { officialSources } from "./sourceRegistry";
import type { OfficialSourceAdapter } from "./types";

const sources = officialSources.filter((source) => source.authority === "IP India");
export const ipIndiaAdapter: OfficialSourceAdapter = {
  sourceId: "ipindia",
  organization: "IP India",
  jurisdiction: "India",
  async search(query) {
    const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
    return sources.filter((source) => terms.some((term) => `${source.title} ${source.authority}`.toLowerCase().includes(term))).map((source) => ({ source, url: source.officialUrl, title: source.title }));
  },
  async fetchDocument(url) {
    const source = sources.find((item) => item.officialUrl === url);
    if (!source) throw new Error(`URL is not registered for IP India: ${url}`);
    return ingestOfficialSource(source);
  },
};
