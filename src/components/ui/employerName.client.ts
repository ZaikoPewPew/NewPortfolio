import { isMobileViewport, prefersReducedMotion } from "../../experience/motion/prefersReducedMotion";
import { feedback } from "../../experience/feedback/FeedbackBus";
import { createWash, type WashController } from "../../experience/wash/wash.client";
import {
  getCurrentlyBlock,
  initCurrentlyBlock,
  resetCurrentlyBlock,
  type CurrentlyBlockActivateOptions,
} from "./currentlyBlock.client";

type EmployerPortal = {
  root: HTMLElement;
  overlay: HTMLElement;
  wash: WashController | null;
};

let sharedPortal: EmployerPortal | null = null;
let sharedFloat: HTMLElement | null = null;
let sharedPrefixFloat: HTMLElement | null = null;
const washByRoot = new WeakMap<HTMLElement, WashController>();

function destroyPortal(portal: EmployerPortal) {
  portal.wash?.destroy();
  washByRoot.delete(portal.root);
  portal.root.remove();
}

function isDesktopEmployer() {
  return !isMobileViewport();
}

function findPortalInDom(): EmployerPortal | null {
  document.querySelectorAll<HTMLElement>("[data-employer-overlay]").forEach((overlay) => {
    if (!overlay.closest("[data-employer-focus-root]")) overlay.remove();
  });

  const roots = document.querySelectorAll<HTMLElement>("[data-employer-focus-root]");
  roots.forEach((root, index) => {
    if (index < roots.length - 1) {
      washByRoot.get(root)?.destroy();
      washByRoot.delete(root);
      root.remove();
    }
  });

  const root = document.querySelector<HTMLElement>("[data-employer-focus-root]");
  if (!root) return null;

  const overlay = root.querySelector<HTMLElement>("[data-employer-overlay]");
  if (!overlay) {
    destroyPortal({ root, overlay: root, wash: null });
    return null;
  }

  let wash = washByRoot.get(root) ?? null;
  const canvas = overlay.querySelector<HTMLCanvasElement>("[data-wash-canvas]");
  if (!wash && canvas && !prefersReducedMotion()) {
    wash = createWash(canvas);
    washByRoot.set(root, wash);
  }

  return { root, overlay, wash };
}

function createPortal(): EmployerPortal {
  const root = document.createElement("div");
  root.className = "employer-focus-root";
  root.setAttribute("data-employer-focus-root", "");
  root.setAttribute("aria-hidden", "true");

  const overlay = document.createElement("div");
  overlay.className = "employer-name__overlay";
  overlay.setAttribute("data-employer-overlay", "");
  overlay.setAttribute("aria-hidden", "true");

  const backdrop = document.createElement("div");
  backdrop.className = "employer-name__backdrop";
  backdrop.setAttribute("aria-hidden", "true");

  const washCanvas = document.createElement("canvas");
  washCanvas.className = "wash__canvas";
  washCanvas.setAttribute("data-wash-canvas", "");
  washCanvas.setAttribute("aria-hidden", "true");

  overlay.append(washCanvas);
  root.append(backdrop, overlay);
  document.body.append(root);

  let wash: WashController | null = null;
  if (!prefersReducedMotion()) {
    wash = createWash(washCanvas);
    washByRoot.set(root, wash);
  }

  return { root, overlay, wash };
}

function getSharedPortal(): EmployerPortal {
  if (sharedPortal && document.body.contains(sharedPortal.root)) {
    return sharedPortal;
  }
  sharedPortal = findPortalInDom() ?? createPortal();
  return sharedPortal;
}

/** Shared blur + wash portal (employer + case company focus). */
export function ensureFocusWashPortal(): EmployerPortal {
  return getSharedPortal();
}

/**
 * Activate focus wash.
 * Hex (`#…`) → dynamic palette via setTint; otherwise theme id via setTintId.
 */
export function activateFocusWash(tint: string = "employer") {
  const { wash } = getSharedPortal();
  if (tint.startsWith("#")) {
    wash?.setTint(tint);
  } else {
    wash?.setTintId(tint);
  }
  document.documentElement.classList.add("is-focus-wash-active");
}

export function deactivateFocusWash() {
  document.documentElement.classList.remove("is-focus-wash-active");
}

/**
 * Floating label — прямой потомок body.
 *
 * position: sticky у header всегда создаёт stacking context (браузерная спека),
 * поэтому z-index внутри header не может превысить его уровень.
 * Float рендерится вне header, в stacking context body → z-index: 250.
 * Prefix float — тот же слой, чтобы «currently at» не уходил под wash.
 * Currently-block — отдельный слой body → z-index: 255, выше float.
 */
function getSharedFloat(): HTMLElement {
  if (sharedFloat && document.body.contains(sharedFloat)) return sharedFloat;

  const existing = document.querySelector<HTMLElement>("[data-employer-float]");
  if (existing) {
    sharedFloat = existing;
    return existing;
  }

  const el = document.createElement("span");
  el.className = "employer-name__label-float";
  el.setAttribute("data-employer-float", "");
  el.setAttribute("aria-hidden", "true");
  document.body.append(el);
  sharedFloat = el;
  return el;
}

function getSharedPrefixFloat(): HTMLElement {
  if (sharedPrefixFloat && document.body.contains(sharedPrefixFloat)) return sharedPrefixFloat;

  const existing = document.querySelector<HTMLElement>("[data-employer-prefix-float]");
  if (existing) {
    sharedPrefixFloat = existing;
    return existing;
  }

  const el = document.createElement("span");
  el.className = "employer-prefix__float";
  el.setAttribute("data-employer-prefix-float", "");
  el.setAttribute("aria-hidden", "true");
  document.body.append(el);
  sharedPrefixFloat = el;
  return el;
}

function syncFloatElement(floatEl: HTMLElement, source: HTMLElement) {
  const rect = source.getBoundingClientRect();
  const s = window.getComputedStyle(source);
  const dpr = window.devicePixelRatio || 1;
  const snap = (v: number) => Math.round(v * dpr) / dpr;
  floatEl.style.top = `${snap(rect.top)}px`;
  floatEl.style.left = `${snap(rect.left)}px`;
  floatEl.style.fontFamily = s.fontFamily;
  floatEl.style.fontSize = s.fontSize;
  floatEl.style.fontWeight = s.fontWeight;
  floatEl.style.fontStyle = s.fontStyle;
  floatEl.style.lineHeight = `${rect.height}px`;
  floatEl.style.letterSpacing = s.letterSpacing;
  floatEl.style.color = s.color;
  floatEl.textContent = source.textContent;
}

function bindEmployerHost(host: HTMLElement) {
  if (host.hasAttribute("data-employer-bound")) return;

  const label = host.querySelector<HTMLElement>(".employer-name__label");
  if (!label) return;

  const prefix = host.parentElement?.querySelector<HTMLElement>("[data-employer-prefix]") ?? null;
  const { wash } = getSharedPortal();
  const block = getCurrentlyBlock();
  const floatEl = getSharedFloat();
  const prefixFloatEl = prefix ? getSharedPrefixFloat() : null;
  const washTintId = host.dataset.washTint ?? "employer";
  const videoSrc = host.dataset.employerVideo;
  host.setAttribute("data-employer-bound", "true");

  const reducedMotion = prefersReducedMotion();
  const disabled = () => reducedMotion || !isDesktopEmployer();

  let isActive = false;
  let focusExitTimer: ReturnType<typeof setTimeout> | null = null;

  const blockOptions = (): CurrentlyBlockActivateOptions => ({
    videoSrc,
  });

  const readFocusWashMs = () => {
    const raw = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--motion-focus-wash"),
    );
    return Number.isFinite(raw) ? raw : 480;
  };

  const cancelFocusExit = () => {
    if (focusExitTimer === null) return;
    clearTimeout(focusExitTimer);
    focusExitTimer = null;
  };

  const syncFloat = () => {
    syncFloatElement(floatEl, label);
    if (prefix && prefixFloatEl) syncFloatElement(prefixFloatEl, prefix);
  };

  const showFloat = () => {
    syncFloat();
    label.style.visibility = "hidden";
    floatEl.style.visibility = "visible";
    if (prefix && prefixFloatEl) {
      prefix.style.visibility = "hidden";
      prefixFloatEl.style.visibility = "visible";
    }
  };

  const hideFloat = () => {
    floatEl.style.visibility = "hidden";
    label.style.visibility = "";
    if (prefix && prefixFloatEl) {
      prefixFloatEl.style.visibility = "hidden";
      prefix.style.visibility = "";
    }
  };

  const settleFocusExit = () => {
    focusExitTimer = null;
    hideFloat();
  };

  const onScrollWhileActive = () => {
    if (!isActive) return;
    syncFloat();
  };

  const activate = (clientX: number, clientY: number) => {
    if (disabled()) return;
    cancelFocusExit();
    if (isActive) {
      block.movePointer(clientX, clientY);
      return;
    }
    isActive = true;
    host.setAttribute("data-employer-active", "");
    wash?.setTintId(washTintId);
    showFloat();
    document.documentElement.classList.add("is-employer-active");
    feedback.emit({ sound: "hoverEmployer", source: "employer.name" });
    window.addEventListener("scroll", onScrollWhileActive, { passive: true });
    block.activate(clientX, clientY, blockOptions());
  };

  const deactivate = (options: { immediate?: boolean } = {}) => {
    if (!isActive && focusExitTimer === null) return;
    cancelFocusExit();
    if (isActive) {
      isActive = false;
      host.removeAttribute("data-employer-active");
      window.removeEventListener("scroll", onScrollWhileActive);
      // Start wash exit; keep float above blur until fade settles.
      document.documentElement.classList.remove("is-employer-active");
      block.deactivate();
    }

    const immediate = options.immediate || reducedMotion;
    const exitMs = readFocusWashMs();
    if (immediate || exitMs <= 0) {
      settleFocusExit();
      return;
    }

    focusExitTimer = setTimeout(settleFocusExit, exitMs);
  };

  host.addEventListener("mouseenter", (event) => {
    activate(event.clientX, event.clientY);
  });

  host.addEventListener("mousemove", (event) => {
    if (!isActive) return;
    block.movePointer(event.clientX, event.clientY);
  });

  host.addEventListener("mouseleave", () => {
    deactivate();
  });

  host.addEventListener("focusin", () => {
    if (disabled() || isActive) return;
    const rect = label.getBoundingClientRect();
    activate(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  host.addEventListener("focusout", (event) => {
    if (host.contains(event.relatedTarget as Node | null)) return;
    deactivate();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden" || !isActive) return;
    deactivate({ immediate: true });
  });
}

export function initEmployerName(root: ParentNode = document) {
  findPortalInDom();
  getCurrentlyBlock();
  root.querySelectorAll<HTMLElement>("[data-employer-name-host]").forEach(bindEmployerHost);
  initCurrentlyBlock(root);
}

export function resetEmployerName() {
  document.documentElement.classList.remove("is-employer-active");
  document.querySelectorAll<HTMLElement>("[data-employer-name-host]").forEach((host) => {
    host.removeAttribute("data-employer-active");
    const lbl = host.querySelector<HTMLElement>(".employer-name__label");
    if (lbl) lbl.style.visibility = "";
    const prefix = host.parentElement?.querySelector<HTMLElement>("[data-employer-prefix]");
    if (prefix) prefix.style.visibility = "";
  });
  if (sharedFloat) sharedFloat.style.visibility = "hidden";
  if (sharedPrefixFloat) sharedPrefixFloat.style.visibility = "hidden";
  resetCurrentlyBlock();
}

export { initCurrentlyBlock, resetCurrentlyBlock } from "./currentlyBlock.client";
