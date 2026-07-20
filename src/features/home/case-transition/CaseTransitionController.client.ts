import { deactivateCaseHover } from "../case-hover/CaseHoverController.client";
import { beginWidgetsNavigationLock } from "../contact/ContactPanelController.client";

export const CASE_TRANSITION_SLUG_KEY = "case-transition-slug";
export const CASE_TRANSITION_ANIMATE_KEY = "case-transition-animate";
export const CASE_TRANSITION_BACK_KEY = "case-transition-back";

let navBound = false;

function getCaseSlugFromPath(pathname: string): string | undefined {
  const match = pathname.match(/\/cases\/([^/]+)\/?$/);
  return match?.[1];
}

function isHomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "/ru" || pathname === "/ru/";
}

function clearPhaseFlags() {
  delete document.documentElement.dataset.caseWidgets;
  document.documentElement.classList.remove("is-case-returning", "is-case-navigating");
  sessionStorage.removeItem(CASE_TRANSITION_BACK_KEY);
  sessionStorage.removeItem(CASE_TRANSITION_ANIMATE_KEY);
  sessionStorage.removeItem(CASE_TRANSITION_SLUG_KEY);
  delete document.documentElement.dataset.caseTransitionSlug;

  const casePage = document.querySelector<HTMLElement>("[data-case-page]");
  if (casePage) {
    delete casePage.dataset.caseEntering;
  }
}

function disableNamedMorphs(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-case-morph], [data-case-list-shell]").forEach((el) => {
    el.style.viewTransitionName = "none";
  });
}

/** Instant home ↔ case: no bento slide / content choreography */
function handleCaseNavClick(event: MouseEvent) {
  const link = (event.target as HTMLElement).closest<HTMLElement>("[data-case-nav]");
  if (!link) return;

  const slug = link.dataset.caseSlug;
  if (!slug) return;

  beginWidgetsNavigationLock();
  deactivateCaseHover({ immediate: true });
  clearPhaseFlags();
  document.documentElement.classList.add("is-case-navigating");
  document.documentElement.dataset.caseTransitionSlug = slug;
  disableNamedMorphs();
}

export function beginCaseTransitionBack() {
  clearPhaseFlags();
  document.documentElement.classList.add("is-case-returning", "is-case-navigating");

  const slug = getCaseSlugFromPath(window.location.pathname);
  if (slug) {
    document.documentElement.dataset.caseTransitionSlug = slug;
  }
  disableNamedMorphs();
}

/** @deprecated Use beginCaseTransitionBack */
export function markCaseTransitionBack() {
  beginCaseTransitionBack();
}

type AstroPreparationEvent = Event & { to?: URL };

export function bindCaseTransition() {
  if (navBound) return;
  navBound = true;

  document.addEventListener("click", handleCaseNavClick, true);

  document.addEventListener(
    "astro:before-preparation",
    (event) => {
      if (document.body.dataset.page !== "case") return;
      const transitionEvent = event as AstroPreparationEvent;
      if (!isHomePath(transitionEvent.to?.pathname ?? "")) return;
      beginCaseTransitionBack();
    },
    true
  );
}

export function resetCaseTransition() {
  // Keep is-case-navigating through preparation so root VT stays instant
  document.querySelectorAll<HTMLElement>(".case-card.is-case-nav-target").forEach((card) => {
    card.classList.remove("is-case-nav-target");
  });
  disableNamedMorphs();
}

export function syncCaseTransitionOnLoad() {
  clearPhaseFlags();
}
