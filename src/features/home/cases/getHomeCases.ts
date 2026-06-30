import { getCollection, type CollectionEntry } from "astro:content";
import { casesConfig } from "../../../config/cases.config";

export type HomeCaseEntry = CollectionEntry<"cases">;

export async function getHomeCases(): Promise<HomeCaseEntry[]> {
  const sorted = (await getCollection("cases")).sort(
    (a, b) => a.data.order - b.data.order
  );

  const { homeLimit } = casesConfig;
  return homeLimit != null ? sorted.slice(0, homeLimit) : sorted;
}
