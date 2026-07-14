import { casesConfig } from "../../../config/cases.config";
import {
  getPublishedCases,
  type CaseEntry,
} from "../../cases/getPublishedCases";

export type HomeCaseEntry = CaseEntry;

export async function getHomeCases(): Promise<HomeCaseEntry[]> {
  const sorted = (await getPublishedCases()).sort(
    (a, b) => a.data.order - b.data.order
  );

  const { homeLimit } = casesConfig;
  return homeLimit != null ? sorted.slice(0, homeLimit) : sorted;
}
