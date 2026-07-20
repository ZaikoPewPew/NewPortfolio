import { casesConfig } from "../../../config/cases.config";
import {
  getPublishedCases,
  type CaseEntry,
} from "../../cases/getPublishedCases";

export type HomeCaseEntry = CaseEntry;

export type HomeCaseCompanyGroup = {
  company: string;
  companyUrl: string;
  /** Wash hex for company link; from first case with companyWash. */
  companyWash?: string;
  cases: HomeCaseEntry[];
};

export async function getHomeCases(): Promise<HomeCaseEntry[]> {
  const sorted = (await getPublishedCases()).sort(
    (a, b) => a.data.order - b.data.order
  );

  const { homeLimit } = casesConfig;
  return homeLimit != null ? sorted.slice(0, homeLimit) : sorted;
}

/** Groups home cases by company, preserving order of first appearance. */
export function groupHomeCasesByCompany(
  cases: HomeCaseEntry[]
): HomeCaseCompanyGroup[] {
  const groups: HomeCaseCompanyGroup[] = [];
  const indexByCompany = new Map<string, number>();

  for (const entry of cases) {
    const { company, companyUrl, companyWash } = entry.data;
    const existing = indexByCompany.get(company);

    if (existing === undefined) {
      indexByCompany.set(company, groups.length);
      groups.push({
        company,
        companyUrl,
        companyWash,
        cases: [entry],
      });
      continue;
    }

    const group = groups[existing];
    if (!group.companyWash && companyWash) {
      group.companyWash = companyWash;
    }
    group.cases.push(entry);
  }

  return groups;
}
