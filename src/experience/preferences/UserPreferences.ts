export type ThemeMode = "dark" | "light";

export interface UserPrefs {
  sound: boolean;
  haptics: boolean;
  theme: ThemeMode;
}

const STORAGE_KEY = "portfolio-preferences";

const defaults: UserPrefs = {
  sound: true,
  haptics: true,
  theme: "dark",
};

function load(): UserPrefs {
  if (typeof localStorage === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

let prefs = load();

export const userPreferences = {
  get(): UserPrefs {
    return { ...prefs };
  },

  set(partial: Partial<UserPrefs>) {
    prefs = { ...prefs, ...partial };
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    }
    document.documentElement.dataset.theme = prefs.theme;
  },

  toggleSound() {
    this.set({ sound: !prefs.sound });
    return prefs.sound;
  },

  toggleHaptics() {
    this.set({ haptics: !prefs.haptics });
    return prefs.haptics;
  },

  toggleTheme() {
    const theme: ThemeMode = prefs.theme === "dark" ? "light" : "dark";
    this.set({ theme });
    return theme;
  },

  init() {
    document.documentElement.dataset.theme = prefs.theme;
  },
};
