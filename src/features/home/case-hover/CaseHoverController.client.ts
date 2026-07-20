import { isMobileViewport, prefersReducedMotion } from "../../../experience/motion/prefersReducedMotion";
import { feedback } from "../../../experience/feedback/FeedbackBus";
import {
  activateFocusWash,
  deactivateFocusWash,
  ensureFocusWashPortal,
} from "../../../components/ui/employerName.client";
import {
  activateCaseFocus,
  deactivateCaseFocus,
  getActiveCaseFocusTarget,
  initCaseFocus,
  resetCaseFocus,
} from "./caseFocus.client";

let boundPage: HTMLElement | null = null;
let boundCasesRegion: HTMLElement | null = null;
let activeCompany: HTMLElement | null = null;
/** Host used for exit hit-test: company link or case title. */
let activeHost: HTMLElement | null = null;
let syncHoverFromPointer: ((clientX: number, clientY: number) => void) | null = null;

function resolveCaseCard(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>("[data-case-card]");
}

function resolveCompanyLink(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>("[data-case-company-link]");
}

function resolveCompany(el: HTMLElement): HTMLElement | null {
  return el.closest<HTMLElement>("[data-case-company]");
}

function clearCompanyFocus() {
  if (!activeCompany) return;
  activeCompany.classList.remove("is-focused");
  activeCompany = null;
}

function isPointerInside(el: HTMLElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function setCaseBlockActive(page: HTMLElement, active: boolean) {
  if (active) {
    document.documentElement.classList.add("is-case-active");
    page.classList.add("is-case-active");
    return;
  }
  document.documentElement.classList.remove("is-case-active");
  page.classList.remove("is-case-active");
}

function focusCompany(company: HTMLElement) {
  if (activeCompany === company) return;
  clearCompanyFocus();
  activeCompany = company;
  company.classList.add("is-focused");
}

function onDocumentPointerMove(e: PointerEvent) {
  syncHoverFromPointer?.(e.clientX, e.clientY);
}

export function deactivateCaseHover() {
  activeHost = null;
  clearCompanyFocus();
  deactivateCaseFocus();
  deactivateFocusWash();

  const page = document.querySelector<HTMLElement>("[data-home-page]");
  document.documentElement.classList.remove("is-case-active");
  page?.classList.remove("is-case-active");
}

export function initCaseHover() {
  const page = document.querySelector<HTMLElement>("[data-home-page]");
  if (!page || boundPage === page) return;

  boundPage = page;
  boundCasesRegion = page.querySelector<HTMLElement>(".home__cases");
  initCaseFocus();
  ensureFocusWashPortal();

  const reducedMotion = prefersReducedMotion();
  const mobile = isMobileViewport();
  const casesRegion = boundCasesRegion;
  if (!casesRegion) return;

  const activateCompanyFocus = (host: HTMLElement, clientX: number, clientY: number) => {
    if (mobile || reducedMotion) return;

    const company = resolveCompany(host);
    if (!company) return;

    activeHost = host;
    focusCompany(company);
    activateFocusWash(host.dataset.washColor || "case");
    setCaseBlockActive(page, false);

    const hasMedia = Boolean(host.dataset.hoverVideo || host.dataset.hoverImage);
    if (hasMedia) {
      activateCaseFocus(host, clientX, clientY, { skipFeedback: true });
    } else {
      deactivateCaseFocus();
    }

    feedback.emit({ sound: "hoverEmployer", source: "case.company" });
  };

  const activateCaseCard = (card: HTMLElement, clientX: number, clientY: number) => {
    if (mobile || reducedMotion) return;

    const company = resolveCompany(card);
    if (!company) return;

    activeHost = card;
    focusCompany(company);
    activateFocusWash(card.dataset.washColor || "case");
    setCaseBlockActive(page, true);
    activateCaseFocus(card, clientX, clientY);
  };

  /**
   * Hit-test under the cursor so currently-block recovers after gap exits.
   * Activation used to rely only on pointerover; document pointermove could
   * deactivate in the gap and leave the next card stuck inactive if over was missed
   * (fast moves, scroll-under-cursor, etc.).
   */
  syncHoverFromPointer = (clientX, clientY) => {
    if (mobile || reducedMotion) return;

    const under = document.elementFromPoint(clientX, clientY);
    if (!(under instanceof Element) || !casesRegion.contains(under)) {
      if (activeHost && !isPointerInside(activeHost, clientX, clientY)) {
        deactivateCaseHover();
      }
      return;
    }

    const caseCard = resolveCaseCard(under);
    if (caseCard) {
      if (caseCard === getActiveCaseFocusTarget() && caseCard === activeHost) return;
      activateCaseCard(caseCard, clientX, clientY);
      return;
    }

    const companyLink = resolveCompanyLink(under);
    if (companyLink) {
      if (companyLink === activeHost) return;
      activateCompanyFocus(companyLink, clientX, clientY);
      return;
    }

    if (activeHost && !isPointerInside(activeHost, clientX, clientY)) {
      deactivateCaseHover();
    }
  };

  document.removeEventListener("pointermove", onDocumentPointerMove);
  document.addEventListener("pointermove", onDocumentPointerMove, { passive: true });

  casesRegion.addEventListener("pointerover", (e) => {
    if (mobile || reducedMotion) return;
    syncHoverFromPointer?.(e.clientX, e.clientY);
  });

  page.addEventListener("pointerleave", () => {
    if (mobile || reducedMotion || !activeHost) return;
    deactivateCaseHover();
  });
}

export function resetCaseHover() {
  document.removeEventListener("pointermove", onDocumentPointerMove);
  syncHoverFromPointer = null;
  boundPage = null;
  boundCasesRegion = null;
  activeHost = null;
  clearCompanyFocus();
  resetCaseFocus();
  deactivateFocusWash();
  document.documentElement.classList.remove("is-case-active");
}
