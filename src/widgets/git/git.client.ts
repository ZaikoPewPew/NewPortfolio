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

export function initGitWidget(root: HTMLElement) {
  if (root.hasAttribute("data-bound")) return;
  root.setAttribute("data-bound", "true");

  const heatmap = root.querySelector<HTMLElement>(".git-widget__heatmap");
  if (!heatmap) return;

  if (heatmap.querySelectorAll(".git-widget__cell").length === 0) return;

  initGitCellTooltips(root, heatmap);
}
