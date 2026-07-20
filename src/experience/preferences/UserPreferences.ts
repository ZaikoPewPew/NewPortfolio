/** Active toggle cycle. Keep `"light"` out to hide it; CSS stays in themes/light.css. */
export const THEME_SEQUENCE = [
  "chocolate",
  "violet",
  "clay",
  "amber",
  "merlot",
  "sage",
  "graphite",
  "soft",
] as const;

export type ThemeMode = (typeof THEME_SEQUENCE)[number];

export interface UserPrefs {
  sound: boolean;
  haptics: boolean;
  theme: ThemeMode;
}

const STORAGE_KEY = "portfolio-preferences";

/** Legacy ids still present in localStorage after renames. */
const THEME_ALIASES: Record<string, ThemeMode> = {
  dark: "chocolate",
};

const defaults: UserPrefs = {
  sound: false,
  haptics: true,
  theme: "graphite",
};

function normalizeTheme(value: unknown): ThemeMode {
  if (typeof value !== "string") return defaults.theme;

  if ((THEME_SEQUENCE as readonly string[]).includes(value)) {
    return value as ThemeMode;
  }

  return THEME_ALIASES[value] ?? defaults.theme;
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

type PrefsListener = (prefs: UserPrefs) => void;
const listeners = new Set<PrefsListener>();

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
    listeners.forEach((listener) => listener({ ...prefs }));
  },

  /** Notified after every `set()` — keeps prefs-driven UI in sync regardless of trigger (click, hotkey). Returns unsubscribe. */
  subscribe(listener: PrefsListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
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
