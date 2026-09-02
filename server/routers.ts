import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { demoCompare, demoRegulatoryPathway, demoScreening } from "./rag";
import { groundedChat } from "./groundedChat";
import { officialSources } from "./integrations/sourceRegistry";
import { retrieveOfficialEvidence } from "./retrieval/retrieve";
import { listPersistedOfficialSources } from "./db";

const screeningInput = z.object({
  productName: z.string().min(1),
  ingredients: z.string(),
  intendedUse: z.string(),
  manufacturingProcess: z.string(),
  existingTraditionalUse: z.string(),
  targetMarket: z.string(),
  additionalInformation: z.string().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  health: publicProcedure.query(() => ({ status: "ok", mode: "demo", service: "ip-sakti-sahayak" })),
  sahayak: router({
    chat: publicProcedure.input(z.object({ question: z.string().min(1), language: z.string().optional(), jurisdiction: z.string().optional(), productType: z.string().optional() })).mutation(({ input }) => groundedChat(input.question, input.language, input.jurisdiction)),
    debug: publicProcedure.input(z.object({ question: z.string().min(1), language: z.string().optional(), jurisdiction: z.string().optional() })).query(async ({ input }) => {
      const result = await retrieveOfficialEvidence(input.question, input.language, input.jurisdiction);
      return { query: result.query, sourceSelected: result.results.map((item) => item.source), documents: result.results.map((item) => item.document), chunks: result.results.map((item) => item.chunk), excerpts: result.results.map((item) => item.chunk.text), failedSources: result.failedSources, stats: result.stats };
    }),
  }),
  screening: router({
    run: publicProcedure.input(screeningInput).mutation(({ input }) => demoScreening(input)),
  }),
  regulatory: router({
    pathway: publicProcedure.input(z.object({ productType: z.string(), targetMarket: z.string() })).query(({ input }) => demoRegulatoryPathway(input.productType, input.targetMarket)),
  }),
  compare: router({
    markets: publicProcedure.input(z.object({ leftMarket: z.string(), rightMarket: z.string() })).query(({ input }) => demoCompare(input.leftMarket, input.rightMarket)),
  }),
  sources: router({
    list: publicProcedure.query(async () => { const rows = await listPersistedOfficialSources(); return rows.length ? rows.map((source) => ({ id: source.id, name: source.name, title: source.title, publisher: source.publisher || source.name, jurisdiction: source.jurisdiction, category: source.category, status: source.status, indexedAt: source.lastVerifiedAt, documentCount: source.documentCount || 0, officialUrl: source.officialUrl })) : officialSources.map((source) => ({ id: source.sourceId, name: source.authority, title: source.title, publisher: source.authority, jurisdiction: source.jurisdiction, category: "Official source", status: source.status, indexedAt: source.lastVerifiedAt || null, documentCount: source.status === "VERIFIED" ? 1 : 0, officialUrl: source.officialUrl })); }),
    byId: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => { const source = officialSources.find((item) => item.sourceId === input.id); return source ? { ...source, id: source.sourceId, name: source.authority, publisher: source.authority, category: "Official source", indexedAt: source.lastVerifiedAt || null, documentCount: source.status === "VERIFIED" ? 1 : 0 } : null; }),
  }),
  reports: router({
    create: publicProcedure.input(z.object({ product: z.string(), question: z.string(), jurisdiction: z.string() })).mutation(({ input }) => ({ id: `demo-report-${Date.now()}`, ...input, mode: "DEMO MODE", createdAt: new Date().toISOString() })),
    list: publicProcedure.query(() => [{ id: "demo-report-1", title: "NīraBalance · IP screening", jurisdiction: "India", mode: "DEMO MODE" }]),
  }),
  translate: publicProcedure.input(z.object({ text: z.string(), targetLanguage: z.string() })).mutation(({ input }) => ({ mode: "DEMO MODE", text: input.text, targetLanguage: input.targetLanguage })),
});

export type AppRouter = typeof appRouter;
