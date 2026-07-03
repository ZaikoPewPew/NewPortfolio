export const CONTACT_PANEL_OPEN_KEY = "contact-panel-open";
export const CONTACT_WIDGETS_NAV_KEY = "contact-widgets-nav";
export const DEFAULT_CONTACT_PANEL_OPEN = false;

export function parseContactPanelOpen(value: string | null): boolean | null {
  if (value === null) return null;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

export function readSavedContactPanelOpen(): boolean | null {
  return parseContactPanelOpen(sessionStorage.getItem(CONTACT_PANEL_OPEN_KEY));
}

export function resolveContactPanelOpen(): boolean {
  return readSavedContactPanelOpen() ?? DEFAULT_CONTACT_PANEL_OPEN;
}
