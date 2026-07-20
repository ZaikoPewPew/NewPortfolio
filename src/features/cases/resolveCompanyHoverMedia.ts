import { siteConfig } from "../../config/site.config";
import { withBase } from "../../lib/withBase";

export type CompanyHoverMedia = {
  hoverVideo?: string;
  hoverImage?: string;
};

/** Priority: companyVideo → companyImage → employer.video when company matches employer label. */
export function resolveCompanyHoverMedia(
  company: string,
  companyVideo?: string,
  companyImage?: string
): CompanyHoverMedia {
  if (companyVideo) {
    return { hoverVideo: withBase(companyVideo) };
  }

  if (companyImage) {
    return { hoverImage: withBase(companyImage) };
  }

  if (company === siteConfig.employer.label) {
    return { hoverVideo: siteConfig.employer.video };
  }

  return {};
}
