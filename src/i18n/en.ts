import type { Translations } from "./types";

const en: Translations = {
  lang: "en",
  langLabel: "EN",

  challenge: {
    acceptButton: "Accept Challenge",
    grid: "Grid",
    target: "Target",
    maxPitStops: (n: number) => `Max ${n} pit stops`,
    laps: (n: number) => `${n} laps`,
    mustUseCompounds: "Must use 2+ compounds",
  },

  strategy: {
    raceTimeline: "Race Timeline",
    tireData: "Tire Data",
    pace: "pace",
    lapDeg: "/lap deg",
    lapLife: "lap life",
    tireLifeWarning: (sec: number) =>
      `Exceeding tire life adds +2.0s/lap penalty · Pit stop costs ${sec}s`,
    startingTire: "Starting Tire",
    pitStop: (n: number) => `Pit Stop ${n}`,
    lap: "Lap",
    nextTire: "Next Tire",
    addStop: "Add Stop",
    enabled: "Enabled",
    simulateButton: "Simulate Race →",
  },

  result: {
    was: "Was",
    now: "Now",
    positionsGained: (n: number) =>
      `+${n} position${Math.abs(n) !== 1 ? "s" : ""} gained`,
    positionsLost: (n: number) =>
      `${n} position${Math.abs(n) !== 1 ? "s" : ""} lost`,
    yourStrategy: "Your Strategy",
    keyMoments: "Key Moments",
    showAll: (n: number) => `Show all ${n} moments`,
    showLess: "Show less",
    score: "Score",
    shareButton: "Share Result",
    retryButton: "Try Again",
    shareTitle: (name: string, from: number, to: number) =>
      `I got ${name} from P${from} to P${to}!`,
    shareText: "Can you beat my strategy? F1 What-If Engine",
    linkCopied: "Link copied to clipboard!",
  },

  moments: {
    overtake: "Overtake",
    undercut: "Undercut",
    overcut: "Overcut",
    lostPosition: "Lost position",
    tireCliff: "Tire cliff",
    passed: (driver: string, pos: number) => `passed ${driver} for P${pos}`,
    dropped: (pos: number) => `dropped to P${pos}`,
    noChanges: "No position changes — try a different strategy",
  },

  standings: {
    title: "Actual vs Your Simulation",
    actualRace: "Actual Race",
    yourSimulation: "Your Simulation",
    fullClassification: "Full Classification ↓",
  },

  chart: {
    title: "Race Progress",
    selectDrivers: (n: number) => `Select up to ${n} drivers`,
    tireChange: "tire change",
    position: "Position",
  },

  share: {
    heading: "F1 What-If Engine",
    beatThis: "Can you beat this? →",
  },

  tiers: {
    legendary: "Strategy God",
    excellent: "Podium Hero",
    target: "Mission Complete",
    improved: "Getting Closer",
    unchanged: "Back to the Drawing Board",
    worse: "That Wasn't the Plan",
  },

  validation: {
    minPitStops: (n: number) => `At least ${n} pit stop required`,
    maxPitStops: (n: number) => `Maximum ${n} pit stops allowed`,
    compoundCount: (expected: number, pits: number) =>
      `Expected ${expected} compounds for ${pits} pit stop${pits !== 1 ? "s" : ""}`,
    minCompounds: (n: number) => `Must use at least ${n} different compounds`,
    pitOrder: "Pit laps must be in ascending order",
    pitTooEarly: (lap: number, min: number) =>
      `Pit lap ${lap} is too early (minimum lap ${min})`,
    pitTooLate: (lap: number, max: number) =>
      `Pit lap ${lap} is too late (maximum lap ${max})`,
    stintTooShort: (stint: number, len: number, min: number) =>
      `Stint ${stint} is only ${len} laps (minimum ${min})`,
  },
};

export default en;
