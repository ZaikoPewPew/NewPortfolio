import { feedback } from "../../experience/feedback/FeedbackBus";
import { userPreferences } from "../../experience/preferences/UserPreferences";
import { getMessages } from "../../i18n";

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

export function initThemeWidget(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-theme-widget-sound]").forEach((btn) => {
    if (btn.hasAttribute("data-bound")) return;
    btn.setAttribute("data-bound", "true");
    syncSoundButton(btn);
    btn.addEventListener("click", () => {
      userPreferences.toggleSound();
      syncSoundButton(btn);
      feedback.emit({ sound: "tap", haptic: "light", source: "themeWidget.sound" });
    });
  });

  root.querySelectorAll<HTMLElement>("[data-live-clock]").forEach((clock) => {
    if (clock.hasAttribute("data-clock-bound")) return;
    clock.setAttribute("data-clock-bound", "true");

    const timezone = clock.getAttribute("data-timezone");
    const timeEl = clock.querySelector("[data-clock-time]");
    if (!timezone || !timeEl) return;

    const update = () => {
      timeEl.textContent = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
        .format(new Date())
        .toLowerCase();
    };

    update();
    setInterval(update, 60_000);
  });
}
