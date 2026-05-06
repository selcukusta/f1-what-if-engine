export type Compound = "soft" | "medium" | "hard";

export type Stint = {
  startLap: number;
  endLap: number;
  compound: Compound;
};

export type DriverData = {
  id: string;
  name: string;
  team: string;
  teamColor: string;
  number: number;
  gridPosition: number;
  basePaceSec: number;
  defaultStrategy: Stint[];
};

export type RaceInfo = {
  name: string;
  year: number;
  totalLaps: number;
  pitLossSec: number;
  overtakeDelta?: number;
  dirtyAirMargin?: number;
};

export type RaceData = {
  race: RaceInfo;
  drivers: DriverData[];
  actualOrder?: string[];
};

export type UserStrategy = {
  pitLaps: number[];
  compounds: Compound[];
};

export type PositionChangeKind =
  | "overtake"
  | "undercut"
  | "overcut"
  | "lost-position"
  | "tire-cliff";

export type PositionChange = {
  lap: number;
  newPosition: number;
  oldPosition: number;
  otherDriverName: string;
  kind: PositionChangeKind;
};

export type SimOutput = {
  finalPosition: number;
  totalTimeSec: number;
  lapTimes: number[];
  positionsPerLap: number[];
  positionChanges: PositionChange[];
  allDriverResults: { driverId: string; finalPosition: number }[];
  allPositionsPerLap: { driverId: string; positions: number[] }[];
};

export type SimResult = {
  finalPosition: number;
  originalPosition: number;
  positionsGained: number;
  totalTimeSec: number;
  lapTimes: number[];
  positionsPerLap: number[];
  score: number;
  positionChanges: PositionChange[];
  tier: string;
  allDriverResults: { driverId: string; finalPosition: number }[];
  allPositionsPerLap: { driverId: string; positions: number[] }[];
};

export type ChallengeTexts = {
  title: string;
  description: string;
};

export type Challenge = {
  id: string;
  texts: Record<string, ChallengeTexts>;
  raceId: string;
  driverId: string;
  originalPosition: number;
  targetPosition: number;
  maxPitStops: number;
  allowedCompounds: Compound[];
  rules: {
    minPitStops: number;
    minCompounds: number;
    minLapsBetweenStops: number;
  };
};

export type ValidationError = {
  field: string;
  message: string;
};
