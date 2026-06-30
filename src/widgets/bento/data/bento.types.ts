export type BentoTileVariant = "mychannel" | "ies" | "youtube";

export interface BentoTile {
  id: string;
  label: string;
  href: string;
  variant: BentoTileVariant;
  caption?: [string, string];
  tooltip?: string[];
}

export interface BentoData {
  tiles: BentoTile[];
}
