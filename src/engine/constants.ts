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

export const TRAFFIC_THRESHOLDS = [
  { maxGap: 1.5, penalty: 0.8 },
  { maxGap: 3.0, penalty: 0.3 },
];

export const TIER_LABELS: Record<string, { label: string; minPosition: number; maxPosition: number }> = {
  legendary: { label: "Strategy God", minPosition: 1, maxPosition: 1 },
  excellent: { label: "Podium Hero", minPosition: 2, maxPosition: 2 },
  target: { label: "Mission Complete", minPosition: 3, maxPosition: 3 },
  improved: { label: "Getting Closer", minPosition: 4, maxPosition: 5 },
  unchanged: { label: "Back to the Drawing Board", minPosition: 6, maxPosition: 6 },
  worse: { label: "That Wasn't the Plan", minPosition: 7, maxPosition: 20 },
};

export function getTierForPosition(position: number): string {
  for (const [, tier] of Object.entries(TIER_LABELS)) {
    if (position >= tier.minPosition && position <= tier.maxPosition) {
      return tier.label;
    }
  }
  return "That Wasn't the Plan";
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

export const ACTUAL_RACE_ORDER: { id: string; name: string; team: string; teamColor: string }[] = [
  { id: "LEC", name: "Charles Leclerc", team: "Ferrari", teamColor: "#E8002D" },
  { id: "PIA", name: "Oscar Piastri", team: "McLaren", teamColor: "#FF8000" },
  { id: "SAI", name: "Carlos Sainz", team: "Ferrari", teamColor: "#E8002D" },
  { id: "NOR", name: "Lando Norris", team: "McLaren", teamColor: "#FF8000" },
  { id: "RUS", name: "George Russell", team: "Mercedes", teamColor: "#27F4D2" },
  { id: "VER", name: "Max Verstappen", team: "Red Bull", teamColor: "#3671C6" },
  { id: "HAM", name: "Lewis Hamilton", team: "Mercedes", teamColor: "#27F4D2" },
  { id: "TSU", name: "Yuki Tsunoda", team: "RB", teamColor: "#6692FF" },
  { id: "ALB", name: "Alexander Albon", team: "Williams", teamColor: "#64C4FF" },
  { id: "GAS", name: "Pierre Gasly", team: "Alpine", teamColor: "#0093CC" },
  { id: "ALO", name: "Fernando Alonso", team: "Aston Martin", teamColor: "#229971" },
  { id: "RIC", name: "Daniel Ricciardo", team: "RB", teamColor: "#6692FF" },
  { id: "BOT", name: "Valtteri Bottas", team: "Sauber", teamColor: "#52E252" },
  { id: "STR", name: "Lance Stroll", team: "Aston Martin", teamColor: "#229971" },
  { id: "SAR", name: "Logan Sargeant", team: "Williams", teamColor: "#64C4FF" },
  { id: "ZHO", name: "Zhou Guanyu", team: "Sauber", teamColor: "#52E252" },
  { id: "OCO", name: "Esteban Ocon", team: "Alpine", teamColor: "#0093CC" },
  { id: "PER", name: "Sergio Perez", team: "Red Bull", teamColor: "#3671C6" },
  { id: "HUL", name: "Nico Hulkenberg", team: "Haas", teamColor: "#B6BABD" },
  { id: "MAG", name: "Kevin Magnussen", team: "Haas", teamColor: "#B6BABD" },
];
