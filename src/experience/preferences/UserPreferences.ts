/** Active toggle cycle. Keep `"light"` out to hide it; CSS stays in themes/light.css. */
export const THEME_SEQUENCE = ["dark", "violet", "clay"] as const;

export type ThemeMode = (typeof THEME_SEQUENCE)[number];

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

function normalizeTheme(value: unknown): ThemeMode {
  if (
    typeof value === "string" &&
    (THEME_SEQUENCE as readonly string[]).includes(value)
  ) {
    return value as ThemeMode;
  }

  return defaults.theme;
}

export function getNextTheme(theme: ThemeMode): ThemeMode {
  const currentIndex = THEME_SEQUENCE.indexOf(theme);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % THEME_SEQUENCE.length;
  return THEME_SEQUENCE[nextIndex];
}

function load(): UserPrefs {
  if (typeof localStorage === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = { ...defaults, ...JSON.parse(raw) };
    return { ...parsed, theme: normalizeTheme(parsed.theme) };
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
    const theme = getNextTheme(prefs.theme);
    this.set({ theme });
    return theme;
  },

  init() {
    document.documentElement.dataset.theme = prefs.theme;
  },
};
