import { siteConfig } from "../../config/site.config";
import { withBase } from "../../lib/withBase";
import type { CaseEntry } from "./getPublishedCases";

export type CaseHoverMedia = {
  hoverVideo?: string;
  hoverImage?: string;
};

/** Priority: previewVideo → previewImage → employer.video */
export function resolveCaseHoverMedia(caseEntry: CaseEntry): CaseHoverMedia {
  const { hover } = caseEntry.data;

  if (hover.previewVideo) {
    return { hoverVideo: withBase(hover.previewVideo) };
  }

  if (hover.previewImage) {
    return { hoverImage: withBase(hover.previewImage) };
  }

  return { hoverVideo: siteConfig.employer.video };
}
