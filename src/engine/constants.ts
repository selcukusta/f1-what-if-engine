import { Compound } from "./types";

export const TIRE_CONFIG: Record<
  Compound,
  {
    effect: number;
    degradationPerLap: number;
    lifetime: number;
    label: string;
  }
> = {
  soft: {
    effect: -1.2,
    degradationPerLap: 0.3,
    lifetime: 15,
    label: "Soft",
  },
  medium: {
    effect: -0.6,
    degradationPerLap: 0.15,
    lifetime: 25,
    label: "Medium",
  },
  hard: {
    effect: 0.3,
    degradationPerLap: 0.05,
    lifetime: 35,
    label: "Hard",
  },
};

export const OVER_LIFETIME_PENALTY = 2.0;

export const FUEL_BURN_PER_LAP = 0.03;

export const COLD_TIRE_PENALTY = 1.5;

export const DIRTY_AIR_DEG_MULTIPLIER = 1.2;

export const DIRTY_AIR_MARGIN = 0.2;

export const OVERTAKE_DELTA_REQUIRED = 2.0;

export const TRAFFIC_THRESHOLDS = [
  { maxGap: 1.5, penalty: 0.8 },
  { maxGap: 3.0, penalty: 0.3 },
];

export const TIER_RANGES: { key: string; minPosition: number; maxPosition: number }[] = [
  { key: "legendary", minPosition: 1, maxPosition: 1 },
  { key: "excellent", minPosition: 2, maxPosition: 2 },
  { key: "target", minPosition: 3, maxPosition: 3 },
  { key: "improved", minPosition: 4, maxPosition: 5 },
  { key: "unchanged", minPosition: 6, maxPosition: 6 },
  { key: "worse", minPosition: 7, maxPosition: 20 },
];

export function getTierForPosition(position: number): string {
  for (const tier of TIER_RANGES) {
    if (position >= tier.minPosition && position <= tier.maxPosition) {
      return tier.key;
    }
  }
  return "worse";
}

export const TEAM_COLORS: Record<string, string> = {
  "Red Bull": "#3671C6",
  Ferrari: "#E8002D",
  McLaren: "#FF8000",
  Mercedes: "#27F4D2",
  RB: "#6692FF",
  Williams: "#64C4FF",
  Alpine: "#0093CC",
  "Aston Martin": "#229971",
  Sauber: "#52E252",
  Haas: "#B6BABD",
};

export const TIRE_COLORS: Record<Compound, string> = {
  soft: "#DA291C",
  medium: "#FFD700",
  hard: "#FFFFFF",
};

