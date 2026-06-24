export type DockActionId =
  | "email"
  | "linkedin"
  | "telegram"
  | "music"
  | "theme";

export interface DockItem {
  id: DockActionId;
  label: string;
  href?: string;
  action?: "toggleTheme" | "toggleMusic";
}

export const dockItems: DockItem[] = [
  { id: "email", label: "email", href: "mailto:hello@example.com" },
  { id: "linkedin", label: "in", href: "https://linkedin.com/" },
  { id: "telegram", label: "tg", href: "https://t.me/" },
  { id: "music", label: "♪", action: "toggleMusic" },
  { id: "theme", label: "☀", action: "toggleTheme" },
];
