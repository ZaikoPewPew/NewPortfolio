import { defineCollection, z } from "astro:content";

const hoverSchema = z.object({
  gradientFrom: z.string(),
  gradientTo: z.string(),
  gradientAngle: z.number().default(135),
  previewImage: z.string().optional(),
  previewVideo: z.string().optional(),
});

const cardSchema = z.object({
  layout: z.enum(["horizontal", "compact"]).default("horizontal"),
  subtitle: z.string().optional(),
  logo: z.string().optional(),
});

const cases = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    cover: z.string(),
    order: z.number(),
    summary: z.string(),
    year: z.number(),
    tags: z.array(z.string()),
    /** demo — всегда в билде; live — только при PUBLIC_CASES_SHOW_LIVE=true */
    visibility: z.enum(["demo", "live"]).default("demo"),
    hover: hoverSchema,
    card: cardSchema.optional(),
  }),
});

export const collections = { cases };
