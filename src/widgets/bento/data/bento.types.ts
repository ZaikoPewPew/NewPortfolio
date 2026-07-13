export type BentoTileVariant = "mychannel" | "ies" | "youtube";

export type BentoTooltipPlacement = "top" | "bottom" | "left" | "right";

export interface BentoTile {
  id: string;
  label: string;
  href: string;
  variant: BentoTileVariant;
  caption?: [string, string];
  tooltip?: string[];
  tooltipPlacement?: BentoTooltipPlacement;
}

export interface BentoData {
  tiles: BentoTile[];
}
