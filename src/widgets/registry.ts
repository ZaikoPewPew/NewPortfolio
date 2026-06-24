import MeWidget from "./me/MeWidget.astro";
import GitWidget from "./git/GitWidget.astro";
import SpotifyWidget from "./spotify/SpotifyWidget.astro";
import IesWidget from "./ies/IesWidget.astro";
import PhotoWidget from "./photo/PhotoWidget.astro";
import type { WidgetGridSpan } from "./_shared/types";

export interface WidgetRegistryEntry {
  id: string;
  component: typeof MeWidget;
  grid: WidgetGridSpan;
}

export const widgetRegistry: WidgetRegistryEntry[] = [
  { id: "me", component: MeWidget, grid: { col: 2, row: 1 } },
  { id: "git", component: GitWidget, grid: { col: 2, row: 1 } },
  { id: "spotify", component: SpotifyWidget, grid: { col: 2, row: 1 } },
  { id: "ies", component: IesWidget, grid: { col: 1, row: 1 } },
  { id: "photo", component: PhotoWidget, grid: { col: 1, row: 1 } },
];
