export type ProcessedQuery = { original: string; language: string; intent: string[]; entities: string[]; jurisdictions: string[]; subQueries: string[] };

export function processQuery(question: string, language = "en"): ProcessedQuery {
  const q = question.toLowerCase();
  const jurisdictions = [/\bindia|भारत|भारतीय\b/.test(q) ? "India" : "", /\busa|u\.s\.|united states|अमेरिका\b/.test(q) ? "United States" : "", /\beu|europe|european union|यूरोप\b/.test(q) ? "European Union" : ""].filter(Boolean);
  const intent = [
    /patent|ip|बौद्धिक संपदा|पेटेंट/.test(q) ? "patent" : "",
    /ayur|herbal|आयुर्वेद|हर्बल/.test(q) ? "ayurveda" : "",
    /regulat|registration|नियामक|पंजीकरण/.test(q) ? "regulation" : "",
    /traditional|tkdl|पारंपरिक ज्ञान/.test(q) ? "traditional-knowledge" : "",
  ].filter(Boolean);
  const entities = q.match(/[a-z][a-z0-9-]{3,}/gi) || [];
  return { original: question, language, intent, entities: Array.from(new Set(entities)).slice(0, 20), jurisdictions: jurisdictions.length ? Array.from(new Set(jurisdictions)) : ["India"], subQueries: [question, ...intent.map((topic) => `${topic} ${jurisdictions.join(" ")}`)] };
}
