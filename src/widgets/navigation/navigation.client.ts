import { initCaseChrome } from "../../features/cases/caseChrome.client";

export function initNavigationWidget(root: ParentNode = document) {
  initCaseChrome();

  root
    .querySelectorAll<HTMLElement>("[data-navigation-scroll-top]")
    .forEach((btn) => {
      if (btn.hasAttribute("data-bound")) return;
      btn.setAttribute("data-bound", "true");

      btn.addEventListener("click", () => {
        const behavior: ScrollBehavior = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? "auto"
          : "smooth";
        window.scrollTo({ top: 0, behavior });
      });
    });
}
