import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { demoChat, demoCompare, demoRegulatoryPathway, demoScreening, getSource, listSources } from "./rag";

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
    chat: publicProcedure.input(z.object({ question: z.string().min(1), language: z.string().optional(), jurisdiction: z.string().optional(), productType: z.string().optional() })).mutation(({ input }) => demoChat(input)),
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
    list: publicProcedure.query(() => listSources()),
    byId: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => getSource(input.id)),
  }),
  reports: router({
    create: publicProcedure.input(z.object({ product: z.string(), question: z.string(), jurisdiction: z.string() })).mutation(({ input }) => ({ id: `demo-report-${Date.now()}`, ...input, mode: "DEMO MODE", createdAt: new Date().toISOString() })),
    list: publicProcedure.query(() => [{ id: "demo-report-1", title: "NīraBalance · IP screening", jurisdiction: "India", mode: "DEMO MODE" }]),
  }),
  translate: publicProcedure.input(z.object({ text: z.string(), targetLanguage: z.string() })).mutation(({ input }) => ({ mode: "DEMO MODE", text: input.text, targetLanguage: input.targetLanguage })),
});

export type AppRouter = typeof appRouter;
