function formatTime(timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());
}

export function initLiveClock(root: ParentNode = document) {
  root.querySelectorAll("[data-live-clock]").forEach((clock) => {
    if (clock.hasAttribute("data-clock-bound")) return;
    clock.setAttribute("data-clock-bound", "true");

    const timezone = clock.getAttribute("data-timezone");
    const timeEl = clock.querySelector("[data-clock-time]");
    if (!timezone || !timeEl) return;

    const update = () => {
      timeEl.textContent = formatTime(timezone);
    };

    update();
    setInterval(update, 1_000);
  });
}
