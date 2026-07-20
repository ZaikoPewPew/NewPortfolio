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
