import { isMobileViewport, prefersReducedMotion } from "../../../experience/motion/prefersReducedMotion";
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

function resolveCaseCard(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null;
  return target.closest<HTMLElement>("[data-case-card]");
}

function resolveCompanyLink(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null;
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
  const host = activeHost;
  if (!host) return;

  if (!isPointerInside(host, e.clientX, e.clientY)) {
    deactivateCaseHover();
  }
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

  const activateCompanyWash = (host: HTMLElement) => {
    if (mobile || reducedMotion) return;

    const company = resolveCompany(host);
    if (!company) return;

    activeHost = host;
    focusCompany(company);
    activateFocusWash(host.dataset.washColor || "case");
    // Company: wash only — no currently-block
    deactivateCaseFocus();
    setCaseBlockActive(page, false);
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

  document.removeEventListener("pointermove", onDocumentPointerMove);
  document.addEventListener("pointermove", onDocumentPointerMove, { passive: true });

  casesRegion.addEventListener("pointerover", (e) => {
    if (mobile || reducedMotion) return;

    const caseCard = resolveCaseCard(e.target);
    if (caseCard) {
      if (caseCard === getActiveCaseFocusTarget() && caseCard === activeHost) return;
      activateCaseCard(caseCard, e.clientX, e.clientY);
      return;
    }

    const companyLink = resolveCompanyLink(e.target);
    if (companyLink) {
      if (companyLink === activeHost) return;
      activateCompanyWash(companyLink);
    }
  });

  page.addEventListener("pointerleave", () => {
    if (mobile || reducedMotion || !activeHost) return;
    deactivateCaseHover();
  });
}

export function resetCaseHover() {
  document.removeEventListener("pointermove", onDocumentPointerMove);
  boundPage = null;
  boundCasesRegion = null;
  activeHost = null;
  clearCompanyFocus();
  resetCaseFocus();
  deactivateFocusWash();
  document.documentElement.classList.remove("is-case-active");
}
