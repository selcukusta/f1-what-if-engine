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
};

export type RaceData = {
  race: RaceInfo;
  drivers: DriverData[];
};

export type UserStrategy = {
  pitLaps: number[];
  compounds: Compound[];
};

export type PositionChange = {
  lap: number;
  newPosition: number;
  oldPosition: number;
  overtakenDriverName: string;
  isPitLap: boolean;
};

export type SimOutput = {
  finalPosition: number;
  totalTimeSec: number;
  lapTimes: number[];
  positionsPerLap: number[];
  positionChanges: PositionChange[];
  allDriverResults: { driverId: string; finalPosition: number }[];
};

export type SimResult = {
  finalPosition: number;
  originalPosition: number;
  positionsGained: number;
  totalTimeSec: number;
  lapTimes: number[];
  positionsPerLap: number[];
  score: number;
  keyMoment: string;
  tier: string;
  allDriverResults: { driverId: string; finalPosition: number }[];
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
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
