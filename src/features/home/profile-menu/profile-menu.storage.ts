export const PROFILE_MENU_OPEN_KEY = "profile-menu-open";
export const DEFAULT_PROFILE_MENU_OPEN = false;

export function parseProfileMenuOpen(value: string | null): boolean | null {
  if (value === null) return null;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

export function readSavedProfileMenuOpen(): boolean | null {
  return parseProfileMenuOpen(sessionStorage.getItem(PROFILE_MENU_OPEN_KEY));
}

export function resolveProfileMenuOpen(): boolean {
  return readSavedProfileMenuOpen() ?? DEFAULT_PROFILE_MENU_OPEN;
}

export function writeProfileMenuOpen(open: boolean) {
  sessionStorage.setItem(PROFILE_MENU_OPEN_KEY, open ? "1" : "0");
}

/** Once the profile has been opened, the "say hi" hint has served its purpose
    and is dismissed for good (persisted across sessions). */
export const SAY_HI_DISMISSED_KEY = "say-hi-dismissed";

export function readSayHiDismissed(): boolean {
  try {
    return localStorage.getItem(SAY_HI_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSayHiDismissed() {
  try {
    localStorage.setItem(SAY_HI_DISMISSED_KEY, "1");
  } catch {
    /* storage unavailable — hint simply keeps showing */
  }
}
