# IP-SAKTI Sahayak

**Protect Ayurveda. Navigate IP & Regulations with AI.**

IP-SAKTI Sahayak is a Smart India Hackathon 2026 prototype for Problem Statement 26045. It is a multilingual, evidence-first product experience for Ayurveda innovators, researchers, manufacturers and IP teams who need a structured starting point for patentability, traditional knowledge, regulatory pathways and cross-border market research.

## Demo safety boundary

The current product runs in **DEMO MODE**. The source cards and answer passages are illustrative records created to demonstrate the retrieval, ranking and citation experience. They are not connected to TKDL, WIPO, the Indian Patent Office, the Ministry of AYUSH, FDA or EU authorities, and must not be treated as verified legal or regulatory information. The interface deliberately keeps this label visible and repeats that outputs are preliminary and not a legal opinion.

## What is implemented

The browser experience includes a presentation-focused landing page, AI Sahayak chat, language switching across English, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada and Bengali, IP screening workflow with staged retrieval animation, regulatory pathway navigator, India/US/EU comparison, source registry with evidence drawer, report generation/export, dashboard, architecture explainer and a judge-ready 2–3 minute flow.

The server includes typed tRPC procedures and replaceable RAG contracts for chat, screening, pathway, comparison, source listing, source detail, report creation/listing, translation and health checks. `server/rag.ts` contains the domain seam for retrieval, embeddings, LLM generation, citation tracing, translation, document ingestion, screening and regulatory services.

## Local development

```bash
pnpm install
pnpm dev
```

The managed project uses a React 19 + TypeScript + Tailwind 4 frontend and an Express/tRPC server. Run validation with:

```bash
pnpm check
pnpm test
pnpm build
```

The project scaffold includes Manus OAuth, database and storage capabilities. No additional secrets are required for the current demo because all answers use local demo services. Environment variables, when needed, are defined by the managed runtime; do not commit `.env` files.

## Project structure

```text
client/src/pages/Home.tsx     Main experience and route-level product flows
client/src/index.css          Forest / ivory / saffron design system
client/src/App.tsx            Theme and application shell
server/rag.ts                 Demo domain services + replaceable RAG interfaces
server/routers.ts             Typed API procedures
server/rag.test.ts            Domain service tests
server/auth.logout.test.ts    Scaffold auth regression test
drizzle/schema.ts             Database schema extension point
```

## API contract map

The managed runtime exposes these through `/api/trpc`:

| Product capability | Procedure | Input | Output shape |
| --- | --- | --- | --- |
| Chat | `sahayak.chat` | question, language, jurisdiction, productType | preliminary answer, findings, risk, next steps, citations |
| IP screening | `screening.run` | formulation brief | risk signals, score, disclaimer, citations |
| Regulatory pathway | `regulatory.pathway` | productType, targetMarket | six-stage pathway and disclaimer |
| Country comparison | `compare.markets` | leftMarket, rightMarket | comparison dimensions and disclaimer |
| Source registry | `sources.list` / `sources.byId` | source id for detail | source metadata / citation record |
| Reports | `reports.create` / `reports.list` | product, question, jurisdiction | report record / demo records |
| Translation seam | `translate` | text, targetLanguage | demo translation response shape |
| Health | `health` | none | service status and demo mode |

For an external REST deployment, these procedures map cleanly to `POST /api/chat`, `POST /api/ip-screening`, `POST /api/regulatory-pathway`, `POST /api/compare`, `GET /api/sources`, `GET /api/sources/{id}`, `POST /api/reports`, `GET /api/reports`, `POST /api/translate` and `GET /api/health`.

## Connecting a real RAG pipeline later

Keep the frontend response shape stable and replace the demo functions behind the service interfaces in `server/rag.ts`:

1. **Document ingestion:** add permitted official documents and metadata such as publisher, jurisdiction, source URL, document type, version and retrieval date.
2. **Chunking:** split documents into traceable passages while preserving page, section and paragraph coordinates.
3. **Embeddings:** implement `EmbeddingService` with the selected embedding model and store model/version metadata.
4. **Vector database:** implement `VectorDatabaseAdapter` for FAISS, Chroma, Pinecone, Weaviate or Qdrant. Keep the provider behind the interface.
5. **Retrieval:** retrieve top-k chunks using the user query plus jurisdiction/product filters.
6. **Reranking:** rank by semantic relevance, source quality, jurisdiction, freshness and document authority.
7. **LLM:** pass only assembled evidence context to `LLMService`; require structured output with uncertainty and citations.
8. **Citation mapping:** use `CitationService` to map claims back to chunk IDs, source records, excerpts and retrieval metadata before returning the response.

The production implementation should fail safely when no source is found, show the no-source state, preserve retrieval timestamps, and never label an unconnected source as verified.

## SIH judge walkthrough

1. Open the landing page and explain the problem: fragmented IP, traditional knowledge risk, regulatory differences and costly preliminary research.
2. Click **Ask Sahayak** and submit “Can I patent this Ayurvedic formulation?”.
3. Point out the retrieval animation, preliminary label, medium risk, jurisdiction and three clickable citations.
4. Open a source citation and show the evidence drawer: excerpt, publisher, jurisdiction, section, citation ID, retrieval note and relevance score.
5. Use the sidebar to open **IP Screening**, complete or submit the formulation brief, and show the five-stage processing state and risk meter.
6. Open **Regulatory Navigator** and click the six stages from classification through market entry.
7. Open **Country Comparison**, switch between India/US, India/EU and US/EU, and explain that the cells are orientation prompts rather than legal conclusions.
8. Open **Reports** and export the structured demo report. End by returning to Sahayak or using **Judge demo** from the workspace header.

## Validation completed

- TypeScript check: passed.
- Vitest: 2 files, 5 tests passed.
- Production build: passed.
- Desktop visual verification: landing, Sahayak, screening, regulatory, comparison, sources, reports and dashboard.
- Mobile visual verification: Sahayak and screening at 375px viewport.
- Browser interaction verification: route navigation, chat submission and response, language menu and visible Hindi UI copy.
