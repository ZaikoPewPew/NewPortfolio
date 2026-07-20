import { defineCollection, z } from "astro:content";

const hoverSchema = z.object({
  gradientFrom: z.string(),
  gradientTo: z.string(),
  gradientAngle: z.number().default(135),
  /** Wash mesh tint on home list hover; falls back to gradientTo. */
  washTint: z.string().optional(),
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
    /** Brand label on home list (not translated). */
    company: z.string(),
    /** External company URL; same within a company group. */
    companyUrl: z.string().url(),
    /** Wash tint for company name hover (hex); same within a company group. */
    companyWash: z.string().optional(),
    /**
     * Home list interaction:
     * plain — text only;
     * hover — dashed pseudo-link + currently-block, no navigation;
     * link — dashed pseudo-link + currently-block + case page.
     */
    interaction: z.enum(["plain", "hover", "link"]).default("link"),
    /** demo — всегда в билде; live — только при PUBLIC_CASES_SHOW_LIVE=true */
    visibility: z.enum(["demo", "live"]).default("demo"),
    hover: hoverSchema,
    card: cardSchema.optional(),
  }),
});

export const collections = { cases };
