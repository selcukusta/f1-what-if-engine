import { Challenge } from "@/engine/types";

export const MONACO_2024_CHALLENGE: Challenge = {
  id: "monaco-2024-ver",
  title: "Rescue the Champion",
  description:
    "Verstappen finished P6 at Monaco 2024. Can you get him to the podium?",
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
