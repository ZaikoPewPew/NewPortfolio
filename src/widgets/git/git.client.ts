import { getMessages, interpolate } from "../../i18n";
import {
  fetchGitContributions,
  GIT_HEATMAP_COLS,
  GIT_HEATMAP_SIZE,
} from "./data/git.api";
import type { GitContributionLevel } from "./data/git.types";
import { formatContributionDate } from "./formatContributionDate";

function clearLevelClasses(cell: HTMLElement) {
  cell.className = cell.className.replace(/\bgit-widget__cell--l[1-4]\b/g, "").trim();
}

function initGitCellTooltips(root: HTMLElement, heatmap: HTMLElement) {
  const shell = root.parentElement ?? root;
  const tooltipHost = shell.querySelector<HTMLElement>("[data-git-tooltip-host]");
  const tooltipLine = tooltipHost?.querySelector<HTMLElement>(".tooltip__line");
  if (!tooltipHost || !tooltipLine) return;

  const tooltipLayer =
    root.parentElement?.closest<HTMLElement>("[data-tooltip-layer]") ??
    heatmap;
  let activeCell: HTMLElement | null = null;

  const hideTooltip = () => {
    activeCell = null;
    tooltipHost.removeAttribute("data-tooltip-visible");
    tooltipLayer.removeAttribute("data-tooltip-layer-active");
  };

  const showTooltip = (cell: HTMLElement) => {
    const label = cell.dataset.tooltipLabel;
    if (!label) {
      hideTooltip();
      return;
    }

    if (activeCell === cell && tooltipHost.hasAttribute("data-tooltip-visible")) {
      return;
    }

    activeCell = cell;
    tooltipLine.textContent = label;

    const shellRect = shell.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();

    tooltipHost.style.left = `${cellRect.left - shellRect.left + cellRect.width / 2}px`;
    tooltipHost.style.top = `${cellRect.top - shellRect.top}px`;

    tooltipHost.setAttribute("data-tooltip-visible", "");
    tooltipLayer.setAttribute("data-tooltip-layer-active", "");
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    const target = document.elementFromPoint(clientX, clientY);
    const cell = target?.closest<HTMLElement>("[data-git-cell]");

    if (!cell || !heatmap.contains(cell)) {
      hideTooltip();
      return;
    }

    showTooltip(cell);
  };

  heatmap.addEventListener("mousemove", (event) => {
    handlePointerMove(event.clientX, event.clientY);
  });

  heatmap.addEventListener("mouseleave", hideTooltip);

  heatmap.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      handlePointerMove(touch.clientX, touch.clientY);
    },
    { passive: true },
  );

  heatmap.addEventListener("touchend", hideTooltip);
  heatmap.addEventListener("touchcancel", hideTooltip);

  const resizeObserver = new ResizeObserver(() => {
    if (!activeCell) return;
    showTooltip(activeCell);
  });
  resizeObserver.observe(shell);
}

function initWholeWidgetLink(root: HTMLElement) {
  const profileUrl = root.dataset.gitProfileUrl;
  if (!profileUrl) return;

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // Keep native link behavior for explicit anchors.
    if (target.closest("a")) return;

    window.open(profileUrl, "_blank", "noopener,noreferrer");
  });
}

function usernameFromProfileUrl(profileUrl: string): string | null {
  const trimmed = profileUrl.replace(/\/$/, "");
  const username = trimmed.split("/").pop();
  return username || null;
}

function levelClass(level: GitContributionLevel): string {
  return level === 0 ? "" : `git-widget__cell--l${level}`;
}

async function refreshLiveContributions(root: HTMLElement) {
  const profileUrl = root.dataset.gitProfileUrl;
  if (!profileUrl) return;

  const username = usernameFromProfileUrl(profileUrl);
  if (!username) return;

  try {
    const live = await fetchGitContributions(username);
    const cells = root.querySelectorAll<HTMLElement>("[data-git-cell]");
    if (cells.length !== live.heatmap.length) return;

    const lastRowStartIndex = GIT_HEATMAP_SIZE - GIT_HEATMAP_COLS;

    live.heatmap.forEach((day, index) => {
      const cell = cells[index];
      if (!cell) return;

      clearLevelClasses(cell);
      const nextLevel = levelClass(day.level);
      if (nextLevel) cell.classList.add(nextLevel);

      if (index < lastRowStartIndex) {
        cell.dataset.tooltipLabel = formatContributionDate(day.date);
      } else {
        delete cell.dataset.tooltipLabel;
      }
    });

    const commitsLayer = root.querySelector<HTMLElement>(
      ".git-widget__username-layer--commits",
    );
    if (commitsLayer) {
      const m = getMessages();
      commitsLayer.textContent = interpolate(m.git.commitsPerYear, {
        count: new Intl.NumberFormat(
          document.documentElement.lang || undefined,
        ).format(live.commitsPerYear),
      });
    }
  } catch (error) {
    console.warn("[git-widget] live refresh failed:", error);
  }
}

export function initGitWidget(root: HTMLElement) {
  if (root.hasAttribute("data-bound")) return;
  root.setAttribute("data-bound", "true");

  const heatmap = root.querySelector<HTMLElement>(".git-widget__heatmap");
  if (!heatmap) return;

  if (heatmap.querySelectorAll(".git-widget__cell").length === 0) return;

  initWholeWidgetLink(root);
  initGitCellTooltips(root, heatmap);
  void refreshLiveContributions(root);
}
