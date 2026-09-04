# IP-SAKTI Sahayak — Phase 4 Technical Report

**Project:** IP-SAKTI Sahayak  
**Scope:** Evidence-first multilingual RAG pipeline for Ayurveda IP and regulatory orientation  
**Validation date:** 4 September 2026  
**UI constraint:** Existing forest-green and ivory identity preserved; no redesign was introduced.

## 1. Executive summary

Phase 4 moves Sahayak from a demo-only response path to a real official-source retrieval pipeline. The backend now fetches registered government and regulatory URLs over the network, extracts substantive HTML or PDF text, normalizes and chunks the text, persists source/document/chunk/evidence/citation metadata in MySQL/TiDB, ranks relevant chunks, and calls the built-in LLM only with the retrieved evidence context. The response contract includes stable evidence IDs, official URLs, retrieval timestamps, document sections, optional page numbers, relevance scores, failed-source explanations, and a structured debug trace.

The pipeline is **verified for eight registered sources in the final database snapshot** and records five sources as unavailable after the latest revalidation attempts. “Unavailable” is intentional: the system does not convert fetch failures, empty bodies, or extraction failures into fabricated evidence. Source status is therefore a live last-attempt status, not a permanent claim that an endpoint is always reachable.

The three required acceptance queries completed with **CONNECTED** LLM responses. Each returned six selected evidence objects, three generated claims, six mapped citations, and a full query-to-evidence-to-claim trace. The international comparison explicitly disclosed that the retrieved U.S. evidence was general FDA drug information and did not establish a specific dietary-supplement or traditional-medicine pathway.

## 2. Current architecture

The request path is:

```text
Sahayak UI
  → tRPC sahayak.chat
  → groundedChat(question, language, jurisdiction)
  → processQuery()
  → official source selection
  → ingestOfficialSource()
       → fetch official HTML/PDF
       → extract substantive text
       → SHA-256 document identity
       → chunk with section/page/canonical URL metadata
       → persist source/document/chunk records
  → keyword ranking over official corpus
  → top evidence objects
  → grounded LLM prompt containing only retrieved excerpts and metadata
  → claim-to-evidence mapping
  → persisted evidence and citations
  → structured response to the existing UI
```

The retrieval layer keeps vector search replaceable. `server/retrieval/semantic.ts` exposes the semantic-provider seam and currently reports that no embedding provider is configured; the active method is therefore `keyword-official-corpus`. The response and debug contracts are already suitable for a later hybrid implementation.

## 3. Exact implementation modules

| Concern | Implementation |
|---|---|
| Sahayak API procedure | `server/routers.ts`, `sahayak.chat` |
| Retrieval inspection API | `server/routers.ts`, `sahayak.debug` |
| Full grounded inspection API | `server/routers.ts`, `sahayak.debugGrounded` |
| Orchestration and LLM grounding | `server/groundedChat.ts` |
| Source registry | `server/integrations/sourceRegistry.ts` |
| Official fetch and persistence | `server/integrations/officialIngestion.ts` and `server/ingestion/officialIngestion.ts` |
| HTML extraction | `server/ingestion/htmlExtractor.ts` |
| PDF extraction | `server/ingestion/pdfExtractor.ts` |
| Chunking | `server/ingestion/chunker.ts` |
| Query parsing | `server/retrieval/queryProcessor.ts` |
| Ranking and source failure handling | `server/retrieval/retrieve.ts` |
| Database helpers | `server/db.ts` |
| Database schema | `drizzle/schema.ts` |
| Existing chat/evidence UI | `client/src/pages/Home.tsx` |

## 4. Official-source verification matrix

The following matrix reflects the source registry and the latest persisted status snapshot after acceptance revalidation. All URLs are the registered official endpoints.

| Required source | Endpoint | Latest status | Evidence / result | Interpretation |
|---|---|---:|---|---|
| IP India | `https://ipindia.gov.in/acts/patent-act-1970` | **VERIFIED** | One persisted document | Official landing page is ingested for registry completeness; substantive retrieval excludes it in favor of targeted pages. |
| IP India — Section 3 | `https://ipindia.gov.in/acts/patent-act-1970/section-3` | **VERIFIED** | Real Section 3 passages; evidence IDs such as `EVD-ipindia-section-3-9f4b75880fea-2` | Retrieved text includes the traditional-knowledge exclusion in Section 3(p). |
| IP India — Section 64 | `https://ipindia.gov.in/acts/patent-act-1970/section-64` | **VERIFIED** | Real Section 64 passages; evidence IDs such as `EVD-ipindia-section-64-bc8bde656392-1` | Retrieved text includes prior-public-knowledge, obviousness/inventive-step, sufficiency, and related revocation grounds. |
| IP India — Guidelines | `https://ipindia.gov.in/resource/patents-resources-guidelines` | **VERIFIED** | Real page and guideline listing; evidence IDs such as `EVD-ipindia-guidelines-55176f1659da-0` | Retrieved page lists Ayush-related invention and traditional-knowledge/biological-material guidance. |
| Ministry of AYUSH — Drugs and Cosmetics PDF | `https://ayush.gov.in/resources/pdf/quality_standards/Drugs-and-Cosmetics-Act-Rules.pdf` | **UNAVAILABLE** | HTTP 404 recorded | No evidence was created from this endpoint. |
| Ministry of AYUSH — Research Portal | `https://arp.ayush.gov.in/` | **UNAVAILABLE** | Latest attempt reported `fetch failed` | No evidence was created from this endpoint. Earlier attempts also recorded an extraction failure; the system preserves the failure rather than inventing content. |
| TKDL | `https://tkdl.res.in/tkdl/langdefault/common/Home.asp?GL=Eng` | **UNAVAILABLE in latest snapshot** | Latest attempt reported `fetch failed` | A prior successful ingestion snapshot (`phase4_ingestion_results_v3.json`) retrieved a real TKDL portal excerpt and one chunk. Subsequent attempts were intermittent, so the current system does not treat TKDL as reliably available. |
| WIPO / WIPO Lex | `https://www.wipo.int/en/web/wipolex/index` | **UNAVAILABLE** | Latest attempt reported `fetch failed` | No WIPO evidence was created. |
| USPTO | `https://www.uspto.gov/patents` | **VERIFIED** | Real “Patents” page; three chunks in the ingestion snapshot | Official U.S. patent-process content is retrievable. |
| FDA | `https://www.fda.gov/drugs` | **VERIFIED** | Real “Drugs” page; four chunks in the ingestion snapshot | Official FDA drug-regulatory content is retrievable. This is not, by itself, a complete dietary-supplement pathway. |
| European Commission | `https://single-market-economy.ec.europa.eu/sectors/cosmetics_en` | **VERIFIED** | Real cosmetics regulatory page; four chunks in the ingestion snapshot | Official EU cosmetics framework content is retrievable. Product classification still controls applicability. |
| EMA | `https://www.ema.europa.eu/en/human-regulatory-overview/herbal-medicinal-products` | **VERIFIED** | Real herbal-medicinal-products page; seven chunks in the ingestion snapshot | Official EMA/HMPC and EU herbal-product pathway content is retrievable. |
| EUR-Lex | `https://eur-lex.europa.eu/` | **UNAVAILABLE** | Official endpoint returned an empty body | No EUR-Lex evidence was created. |

The latest database aggregate is **8 VERIFIED** and **5 UNAVAILABLE** source records, with **68 persisted documents**, **561 chunks**, **58 verified evidence rows**, and **90 citation rows**. The document and citation totals include repeated acceptance/revalidation persistence and are intentionally not presented as a hardcoded “source count.”

## 5. Evidence and citation guarantees

Every evidence object is created from a retrieved official document and contains:

- a deterministic evidence ID derived from source ID, document SHA-256 prefix, and chunk index;
- source ID, authority, official URL, jurisdiction, document title, and section;
- optional PDF page metadata when available;
- the extracted excerpt, unchanged after extraction normalization;
- retrieval timestamp and relevance score;
- `verificationStatus: VERIFIED`.

Every citation contains a stable citation ID, claim ID, evidence ID, source ID, official URL, document title, section, excerpt, and verification status. The grounded response additionally returns `claimEvidenceMap`, so a judge or developer can inspect the exact mapping instead of trusting a count.

The new `debugTrace` object records the complete chain:

```text
query
→ normalizedQuery and jurisdiction filters
→ sourcesSearched
→ documentsMatched
→ chunksMatched
→ retrievalScores
→ finalEvidence
→ claims
→ claimEvidenceMap
→ llmResponse
```

The `sahayak.debugGrounded` endpoint exposes this trace through the typed tRPC contract for local inspection and Judge Demo instrumentation.

## 6. Required acceptance tests

The acceptance harness is `/home/ubuntu/run_phase4_debug_acceptance.ts`. Its full output is stored in `/home/ubuntu/phase4_debug_acceptance_results.json`.

| Test | Scenario | LLM | Sources searched | Sources with matches | Chunks retrieved | Evidence selected | Claims | Citations | Failed sources |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| TEST-1 | Hindi India-to-U.S. export question | CONNECTED | 9 | 5 | 10 | 6 | 3 | 6 | AYUSH PDF, AYUSH Research Portal, TKDL |
| TEST-2 | Indian patentability of a new extraction process with traditional ingredients | CONNECTED | 7 | 3 | 6 | 6 | 3 | 6 | AYUSH PDF, AYUSH Research Portal, TKDL |
| TEST-3 | U.S. versus EU Ayurvedic-herbal marketing considerations | CONNECTED | 5 | 4 | 8 | 6 | 3 | 6 | EUR-Lex |

Representative trace results:

- **TEST-1** final evidence included IP India Section 64, IP India guidelines, IP India Section 3, and FDA excerpts. The claim map linked `CLM-001`, `CLM-002`, and `CLM-003` to stable evidence IDs, including `EVD-ipindia-section-64-bc8bde656392-1` and `EVD-ipindia-guidelines-55176f1659da-0`.
- **TEST-2** final evidence included Section 3(p), Section 64, and IP India guidelines. The response treated traditional knowledge and prior art as issues for professional review rather than asserting a patentability conclusion.
- **TEST-3** final evidence included FDA, EMA herbal products, and European Commission cosmetics excerpts. The answer explicitly stated that the supplied U.S. material did not establish a specific dietary-supplement or alternative-medicine route.

## 7. Multilingual behavior

The UI supports English, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, and Bengali through the centralized language pack in `client/src/i18n`. The selected response language is passed to `sahayak.chat`, included in the grounded LLM prompt, and reflected in the response content where the model is connected. The pipeline retains source excerpts in their original language and labels the response language separately from source language.

## 8. UI provenance update

The existing UI was preserved. The verified evidence path in `client/src/pages/Home.tsx` now carries and displays:

- document/section;
- page, or “Not specified” for HTML evidence without pagination;
- retrieval timestamp;
- relevance score;
- citation ID;
- canonical official URL;
- authority and jurisdiction;
- extracted official excerpt;
- verification trail and unavailable-source status.

The existing **Why this answer?** panel now includes evidence provenance summaries, while the Evidence Drawer exposes the canonical URL as a clickable official link. No forest-green/ivory design tokens, layouts, or visual identity were replaced.

## 9. Known limitations and honest next steps

The active retrieval method is deterministic keyword ranking, not semantic vector search. The vector-ready interfaces exist, but no embedding provider or vector database connector is configured in this session. The next engineering step is to implement an approved `EmbeddingProvider` and `VectorStore`, then evaluate hybrid keyword-plus-semantic ranking against the same acceptance queries.

The AYUSH PDF URL is currently a 404, AYUSH Research Portal and WIPO/TKDL have intermittent or failed fetches, and EUR-Lex returns an empty body from its landing endpoint. These should be revisited with stable official document URLs or permitted connectors. Until then, the UI and API must continue to show them as unavailable and must not use fallback/demo passages in the verified response.

The verified evidence is source-grounded orientation, not legal, patent, medical, or regulatory advice. The response already includes professional-review disclaimers; this distinction should remain visible in any future Judge Demo export.

## 10. Validation performed

The final implementation passed:

```text
pnpm check                 PASS
pnpm test -- --run         PASS — 4 files, 9 tests
pnpm build                 PASS — Vite client and bundled server
Phase 4 required queries   PASS — 3/3 LLM-connected responses
Debug trace harness        PASS — trace artifact generated for 3/3 queries
```

The only build note is the existing Vite warning about a client chunk larger than 500 kB. It does not block production build completion and was not addressed because it is outside the Phase 4 RAG acceptance scope.

## 11. Reproducibility artifacts

- `/home/ubuntu/phase4_ingestion_results_v3.json` — official ingestion snapshot, including source hashes and excerpts.
- `/home/ubuntu/phase4_acceptance_results_v3.json` — required-query response snapshot with evidence and citations.
- `/home/ubuntu/phase4_debug_acceptance_results.json` — latest full debug-trace snapshot.
- `/home/ubuntu/phase4_debug_trace_summary.json` — compact source/chunk/evidence/claim mapping summary.
- `/home/ubuntu/run_phase4_ingestion.ts` — ingestion harness.
- `/home/ubuntu/run_phase4_acceptance.ts` — required-query harness.
- `/home/ubuntu/run_phase4_debug_acceptance.ts` — full trace harness.

**Phase 4 conclusion:** The system is ready for an evidence-first Smart India Hackathon demonstration with verified-source labels, explicit unavailable-source handling, real citation objects, multilingual response support, and a complete inspectable RAG trace. Semantic retrieval and a more stable AYUSH/TKDL/WIPO/EUR-Lex connector layer remain the next production-hardening steps.
