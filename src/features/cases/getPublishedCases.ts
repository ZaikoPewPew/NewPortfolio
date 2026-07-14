import { getCollection, type CollectionEntry } from "astro:content";
import { env } from "../../config/env.config";

export type CaseEntry = CollectionEntry<"cases">;

/** Кейсы, доступные в текущем билде (demo всегда; live — по флагу). */
export async function getPublishedCases(): Promise<CaseEntry[]> {
  const { showLive } = env.cases;
  return getCollection("cases", ({ data }) => {
    if (data.visibility === "live") return showLive;
    return true;
  });
}
