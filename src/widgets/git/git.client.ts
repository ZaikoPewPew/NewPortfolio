import { prefersReducedMotion } from "../../experience/motion/prefersReducedMotion";

const REVEAL_RADIUS_PX = 32;

type FogMode = "paint" | "erase";

export function initGitWidget(root: HTMLElement) {
  if (root.hasAttribute("data-bound")) return;
  root.setAttribute("data-bound", "true");

  const heatmap = root.querySelector<HTMLElement>(".git-widget__heatmap");
  if (!heatmap) return;

  const cells = Array.from(
    heatmap.querySelectorAll<HTMLElement>(".git-widget__cell"),
  );
  if (cells.length === 0) return;

  if (prefersReducedMotion()) {
    root.setAttribute("data-git-hover-all", "");
    return;
  }

  root.setAttribute("data-fog-active", "");

  const revealed = new Set<number>();
  let cellCenters: { x: number; y: number }[] = [];
  let rafId = 0;
  let pendingX = 0;
  let pendingY = 0;
  let mode: FogMode = "paint";
  let isInside = false;

  const measureCells = () => {
    const heatmapRect = heatmap.getBoundingClientRect();
    cellCenters = cells.map((cell) => {
      const rect = cell.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - heatmapRect.left,
        y: rect.top + rect.height / 2 - heatmapRect.top,
      };
    });
  };

  const toggleMode = () => {
    mode = mode === "paint" ? "erase" : "paint";
  };

  const applyFogNear = (clientX: number, clientY: number) => {
    const heatmapRect = heatmap.getBoundingClientRect();
    const x = clientX - heatmapRect.left;
    const y = clientY - heatmapRect.top;
    const radiusSq = REVEAL_RADIUS_PX * REVEAL_RADIUS_PX;

    cellCenters.forEach((center, index) => {
      const dx = center.x - x;
      const dy = center.y - y;
      if (dx * dx + dy * dy > radiusSq) return;

      if (mode === "paint") {
        if (revealed.has(index)) return;
        revealed.add(index);
        cells[index].classList.add("git-widget__cell--revealed");
        return;
      }

      if (!revealed.has(index)) return;
      revealed.delete(index);
      cells[index].classList.remove("git-widget__cell--revealed");
    });
  };

  const scheduleApply = (clientX: number, clientY: number) => {
    pendingX = clientX;
    pendingY = clientY;
    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      rafId = 0;
      applyFogNear(pendingX, pendingY);
    });
  };

  const handleEnter = () => {
    isInside = true;
  };

  const handleLeave = () => {
    if (!isInside) return;
    isInside = false;
    toggleMode();
  };

  measureCells();

  const resizeObserver = new ResizeObserver(measureCells);
  resizeObserver.observe(heatmap);

  root.addEventListener("mouseenter", handleEnter);

  root.addEventListener("mousemove", (event) => {
    if (!isInside) return;
    scheduleApply(event.clientX, event.clientY);
  });

  root.addEventListener("mouseleave", handleLeave);

  root.addEventListener("touchstart", handleEnter, { passive: true });

  root.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (touch) scheduleApply(touch.clientX, touch.clientY);
    },
    { passive: true },
  );

  root.addEventListener("touchend", handleLeave);
  root.addEventListener("touchcancel", handleLeave);
}
