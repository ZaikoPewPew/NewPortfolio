import { userPreferences } from "../../experience/preferences/UserPreferences";
import { getMessages } from "../../i18n";
import { initDragTooltips } from "../../components/ui/tooltip.client";

/** Longest flip duration + delay + buffer */
const OPEN_SETTLE_MS = 780;

const STONE_EASE = "cubic-bezier(0.22, 1.2, 0.36, 1)";
const settleTimers = new WeakMap<HTMLElement, number>();

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function syncSoundButton(btn: HTMLElement) {
  const soundOn = userPreferences.get().sound;
  const m = getMessages().themeWidget;
  btn.setAttribute("aria-pressed", soundOn ? "true" : "false");
  btn.setAttribute(
    "aria-label",
    soundOn ? m.soundOnAriaLabel : m.soundOffAriaLabel
  );
  btn.toggleAttribute("data-sound-muted", !soundOn);
}

function clearSettleTimer(widget: HTMLElement) {
  const prev = settleTimers.get(widget);
  if (prev !== undefined) window.clearTimeout(prev);
  settleTimers.delete(widget);
}

function clearStoneStyles(widget: HTMLElement) {
  widget.querySelectorAll<HTMLElement>("[data-stone]").forEach((stone) => {
    stone.style.removeProperty("transition");
    stone.style.removeProperty("transform");
    stone.style.removeProperty("opacity");
  });
}

/** Stones start stacked on the anchor, then FLIP into tray slots. */
function playOpenFromAnchor(widget: HTMLElement, trigger: HTMLElement) {
  const stones = [
    ...widget.querySelectorAll<HTMLElement>("[data-stone]"),
  ];
  const origin = trigger.getBoundingClientRect();
  const ox = origin.left + origin.width / 2;
  const oy = origin.top + origin.height / 2;

  stones.forEach((stone) => {
    const last = stone.getBoundingClientRect();
    const lx = last.left + last.width / 2;
    const ly = last.top + last.height / 2;
    const dx = ox - lx;
    const dy = oy - ly;

    const stoneIndex = Number(stone.dataset.stone ?? "1");
    /* Closest to anchor leads; leftmost travels longest */
    const lead = stones.length + 1 - stoneIndex;
    const delay = 20 + lead * 40;
    const duration = 440 + lead * 50;

    stone.style.transition = "none";
    stone.style.transform = `translate(${dx}px, ${dy}px) scale(0.5)`;
    stone.style.opacity = "0";
  });

  void widget.offsetWidth;

  stones.forEach((stone) => {
    const stoneIndex = Number(stone.dataset.stone ?? "1");
    const lead = stones.length + 1 - stoneIndex;
    const delay = 20 + lead * 40;
    const duration = 440 + lead * 50;

    stone.style.transition = [
      `transform ${duration}ms ${STONE_EASE} ${delay}ms`,
      `opacity ${Math.round(duration * 0.55)}ms ease-out ${delay}ms`,
    ].join(", ");
    stone.style.transform = "translate(0px, 0px) scale(1)";
    stone.style.opacity = "1";
  });
}

function setMenuOpen(
  widget: HTMLElement,
  open: boolean,
  { restoreFocus = false }: { restoreFocus?: boolean } = {}
) {
  const trigger = widget.querySelector<HTMLElement>("[data-theme-widget-trigger]");
  const panel = widget.querySelector<HTMLElement>("[data-theme-widget-panel]");
  if (!trigger || !panel) return;

  clearSettleTimer(widget);
  widget.removeAttribute("data-settled");
  clearStoneStyles(widget);

  widget.toggleAttribute("data-open", open);
  trigger.setAttribute("aria-expanded", open ? "true" : "false");
  trigger.setAttribute(
    "aria-label",
    open
      ? (widget.getAttribute("data-close-label") ?? "Close")
      : (widget.getAttribute("data-open-label") ?? "Open")
  );
  panel.setAttribute("aria-hidden", open ? "false" : "true");
  panel.toggleAttribute("inert", !open);

  if (open) {
    if (!prefersReducedMotion()) {
      playOpenFromAnchor(widget, trigger);
    }

    const timer = window.setTimeout(() => {
      clearStoneStyles(widget);
      widget.setAttribute("data-settled", "");
      settleTimers.delete(widget);
    }, OPEN_SETTLE_MS);
    settleTimers.set(widget, timer);
  }

  if (!open && restoreFocus) {
    trigger.focus();
  }
}

function initThemeWidgetMenus(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-theme-widget]").forEach((widget) => {
    if (widget.hasAttribute("data-menu-bound")) return;
    widget.setAttribute("data-menu-bound", "true");

    const trigger = widget.querySelector<HTMLElement>(
      "[data-theme-widget-trigger]"
    );
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      const willOpen = !widget.hasAttribute("data-open");
      setMenuOpen(widget, willOpen);
    });

    document.addEventListener("pointerdown", (event) => {
      if (!widget.hasAttribute("data-open")) return;
      const target = event.target;
      if (!(target instanceof Node) || widget.contains(target)) return;
      setMenuOpen(widget, false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !widget.hasAttribute("data-open")) return;
      setMenuOpen(widget, false, { restoreFocus: true });
    });
  });
}

function syncAllSoundButtons() {
  document
    .querySelectorAll<HTMLElement>("[data-theme-widget-sound]")
    .forEach(syncSoundButton);
}

let soundSyncSubscribed = false;

export function initThemeWidget(root: ParentNode = document) {
  initThemeWidgetMenus(root);
  initDragTooltips(root);

  /* Reflect sound state from any source (click, hotkey `s`). */
  if (!soundSyncSubscribed) {
    soundSyncSubscribed = true;
    userPreferences.subscribe(syncAllSoundButtons);
  }

  root.querySelectorAll<HTMLElement>("[data-theme-widget-sound]").forEach((btn) => {
    if (btn.hasAttribute("data-bound")) return;
    btn.setAttribute("data-bound", "true");
    syncSoundButton(btn);
    btn.addEventListener("click", () => {
      userPreferences.toggleSound();

      const host = btn.closest<HTMLElement>("[data-tooltip-host]");
      if (host) {
        host.removeAttribute("data-tooltip-visible");
        host.setAttribute("data-tooltip-dismissed", "");
      }
    });
  });
}
