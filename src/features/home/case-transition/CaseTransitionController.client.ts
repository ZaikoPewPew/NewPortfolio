import { isMobileViewport, prefersReducedMotion } from "../../../experience/motion/prefersReducedMotion";
import { deactivateCaseHover } from "../case-hover/CaseHoverController.client";
import { beginWidgetsNavigationLock } from "../contact/ContactPanelController.client";

export const CASE_TRANSITION_SLUG_KEY = "case-transition-slug";
export const CASE_TRANSITION_ANIMATE_KEY = "case-transition-animate";
export const CASE_TRANSITION_BACK_KEY = "case-transition-back";

let navBound = false;
let enterTimer: number | undefined;
let returnTimer: number | undefined;

function shouldAnimateTransition(): boolean {
  return !isMobileViewport() && !prefersReducedMotion();
}

function clearEnterTimer() {
  if (enterTimer !== undefined) {
    window.clearTimeout(enterTimer);
    enterTimer = undefined;
  }
}

function clearReturnTimer() {
  if (returnTimer !== undefined) {
    window.clearTimeout(returnTimer);
    returnTimer = undefined;
  }
}

function readMotionMs(token: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getCaseSlugFromPath(pathname: string): string | undefined {
  const match = pathname.match(/\/cases\/([^/]+)\/?$/);
  return match?.[1];
}

function isHomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "/ru" || pathname === "/ru/";
}

function resetViewTransitionNames(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-case-morph], [data-case-list-shell]").forEach((el) => {
    el.style.removeProperty("view-transition-name");
  });

  document.querySelectorAll<HTMLElement>(".case-card.is-case-nav-target").forEach((card) => {
    card.classList.remove("is-case-nav-target");
  });

  document.documentElement.classList.remove("is-case-navigating");
  delete document.documentElement.dataset.caseTransitionSlug;
}

function prepareViewTransitionNames(activeSlug: string) {
  document.documentElement.classList.add("is-case-navigating");
  document.documentElement.dataset.caseTransitionSlug = activeSlug;

  document.querySelectorAll<HTMLElement>("[data-case-card]").forEach((card) => {
    const cardSlug = card.dataset.caseSlug;
    const morph = card.querySelector<HTMLElement>("[data-case-morph]");
    const listShell = card.querySelector<HTMLElement>("[data-case-list-shell]");

    if (!cardSlug || !morph || !listShell) return;

    if (cardSlug === activeSlug) {
      card.classList.add("is-case-nav-target");
      listShell.style.viewTransitionName = "none";
      morph.style.removeProperty("view-transition-name");
    } else {
      morph.style.viewTransitionName = "none";
      listShell.style.removeProperty("view-transition-name");
    }
  });
}

function prepareIncomingHomeCard(newDocument: Document, slug: string) {
  const card = newDocument.querySelector<HTMLElement>(`[data-case-slug="${slug}"]`);
  if (!card) return;

  const morph = card.querySelector<HTMLElement>("[data-case-morph]");
  const listShell = card.querySelector<HTMLElement>("[data-case-list-shell]");
  if (!morph || !listShell) return;

  card.classList.add("is-case-nav-target");
  listShell.style.viewTransitionName = "none";
  morph.style.removeProperty("view-transition-name");
}

function handleCaseNavClick(event: MouseEvent) {
  if (!shouldAnimateTransition()) return;

  const link = (event.target as HTMLElement).closest<HTMLElement>("[data-case-nav]");
  if (!link) return;

  const slug = link.dataset.caseSlug;
  if (!slug) return;

  beginWidgetsNavigationLock();
  sessionStorage.setItem(CASE_TRANSITION_SLUG_KEY, slug);
  sessionStorage.setItem(CASE_TRANSITION_ANIMATE_KEY, "1");
  deactivateCaseHover();
  prepareViewTransitionNames(slug);
}

function syncCasePageEnter() {
  const casePage = document.querySelector<HTMLElement>("[data-case-page]");
  if (!casePage) return;

  clearEnterTimer();

  const shouldAnimate = sessionStorage.getItem(CASE_TRANSITION_ANIMATE_KEY) === "1";
  sessionStorage.removeItem(CASE_TRANSITION_ANIMATE_KEY);
  sessionStorage.removeItem(CASE_TRANSITION_SLUG_KEY);

  if (!shouldAnimate || !shouldAnimateTransition()) {
    delete casePage.dataset.caseEntering;
    return;
  }

  casePage.dataset.caseEntering = "true";

  const totalMs = readMotionMs("--motion-case-total", 560);

  enterTimer = window.setTimeout(() => {
    delete casePage.dataset.caseEntering;
    enterTimer = undefined;
  }, totalMs);
}

function finishCaseReturn() {
  document.documentElement.classList.remove("is-case-returning");
  delete document.documentElement.dataset.caseTransitionSlug;
  sessionStorage.removeItem(CASE_TRANSITION_BACK_KEY);
}

function syncHomePageReturn() {
  if (!document.documentElement.classList.contains("is-case-returning")) return;

  clearReturnTimer();
  const backMs = readMotionMs("--motion-case-back", 360);
  returnTimer = window.setTimeout(() => {
    finishCaseReturn();
    returnTimer = undefined;
  }, backMs);
}

export function beginCaseTransitionBack() {
  if (!shouldAnimateTransition()) return;

  const slug =
    document.documentElement.dataset.caseTransitionSlug ??
    getCaseSlugFromPath(window.location.pathname);

  sessionStorage.setItem(CASE_TRANSITION_BACK_KEY, "1");
  document.documentElement.classList.add("is-case-returning");

  if (slug) {
    document.documentElement.dataset.caseTransitionSlug = slug;
  }
}

/** @deprecated Use beginCaseTransitionBack */
export function markCaseTransitionBack() {
  beginCaseTransitionBack();
}

type AstroTransitionEvent = Event & { to?: URL; newDocument?: Document };

export function bindCaseTransition() {
  if (navBound) return;
  navBound = true;

  document.addEventListener("click", handleCaseNavClick, true);

  document.addEventListener("astro:before-preparation", (event) => {
    if (document.body.dataset.page !== "case") return;

    const transitionEvent = event as AstroTransitionEvent;
    if (!isHomePath(transitionEvent.to?.pathname ?? "")) return;

    beginCaseTransitionBack();
  });

  document.addEventListener("astro:before-swap", (event) => {
    if (sessionStorage.getItem(CASE_TRANSITION_BACK_KEY) !== "1") return;

    const swapEvent = event as AstroTransitionEvent;
    const slug = document.documentElement.dataset.caseTransitionSlug;
    if (!swapEvent.newDocument || !slug) return;

    prepareIncomingHomeCard(swapEvent.newDocument, slug);
  });
}

export function resetCaseTransition() {
  clearEnterTimer();
  clearReturnTimer();
  resetViewTransitionNames();
  finishCaseReturn();

  const casePage = document.querySelector<HTMLElement>("[data-case-page]");
  if (casePage) {
    delete casePage.dataset.caseEntering;
  }
}

export function syncCaseTransitionOnLoad() {
  if (document.body.dataset.page === "case") {
    syncCasePageEnter();
    return;
  }

  if (document.body.dataset.page === "home") {
    syncHomePageReturn();
  }
}
