import { Challenge, RaceData } from "@/engine/types";
import monaco2024Json from "@/data/monaco-2024.json";
import miami2026Json from "@/data/miami-2026.json";

export const MONACO_2024_CHALLENGE: Challenge = {
  id: "monaco-2024-ver",
  texts: {
    en: {
      title: "Rescue the Champion",
      description:
        "Verstappen finished P6 at Monaco 2024. Can you get him to the podium?",
    },
    tr: {
      title: "Şampiyonu Kurtar",
      description:
        "Verstappen, 2024 Monako'da P6 bitirdi. Onu podyuma çıkarabilir misin?",
    },
  },
  raceId: "monaco-2024",
  driverId: "VER",
  originalPosition: 6,
  targetPosition: 3,
  maxPitStops: 2,
  allowedCompounds: ["soft", "medium", "hard"],
  rules: {
    minPitStops: 1,
    minCompounds: 2,
    minLapsBetweenStops: 5,
  },
};

export const MIAMI_2026_CHALLENGE: Challenge = {
  id: "miami-2026-lec",
  texts: {
    en: {
      title: "The Prancing Horse Returns",
      description:
        "Leclerc finished P6 at Miami 2026. Can you get him to the podium?",
    },
    tr: {
      title: "Şaha Kalkan At",
      description:
        "Leclerc, 2026 Miami'de P6 bitirdi. Onu podyuma çıkarabilir misin?",
    },
  },
  raceId: "miami-2026",
  driverId: "LEC",
  originalPosition: 6,
  targetPosition: 3,
  maxPitStops: 2,
  allowedCompounds: ["soft", "medium", "hard"],
  rules: {
    minPitStops: 1,
    minCompounds: 2,
    minLapsBetweenStops: 5,
  },
};

export const CHALLENGES: Challenge[] = [
  MIAMI_2026_CHALLENGE,
  MONACO_2024_CHALLENGE,
];

export function getChallengeById(id: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

const RACE_DATA_MAP: Record<string, RaceData> = {
  "monaco-2024": monaco2024Json as RaceData,
  "miami-2026": miami2026Json as RaceData,
};

export function getRaceDataForChallenge(challenge: Challenge): RaceData {
  const data = RACE_DATA_MAP[challenge.raceId];
  if (!data) throw new Error(`Unknown raceId: ${challenge.raceId}`);
  return data;
}
