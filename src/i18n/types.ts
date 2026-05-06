export type Translations = {
  lang: string;
  langLabel: string;

  challenge: {
    acceptButton: string;
    grid: string;
    target: string;
    maxPitStops: (n: number) => string;
    laps: (n: number) => string;
    mustUseCompounds: string;
  };

  strategy: {
    raceTimeline: string;
    tireData: string;
    pace: string;
    lapDeg: string;
    lapLife: string;
    tireLifeWarning: (sec: number) => string;
    startingTire: string;
    pitStop: (n: number) => string;
    lap: string;
    nextTire: string;
    addStop: string;
    enabled: string;
    simulateButton: string;
  };

  result: {
    was: string;
    now: string;
    positionsGained: (n: number) => string;
    positionsLost: (n: number) => string;
    yourStrategy: string;
    keyMoments: string;
    showAll: (n: number) => string;
    showLess: string;
    score: string;
    shareButton: string;
    retryButton: string;
    homeButton: string;
    shareTitle: (name: string, from: number, to: number) => string;
    shareText: string;
    linkCopied: string;
  };

  moments: {
    overtake: string;
    undercut: string;
    overcut: string;
    lostPosition: string;
    tireCliff: string;
    passed: (driver: string, pos: number) => string;
    dropped: (pos: number) => string;
    noChanges: string;
  };

  standings: {
    title: string;
    actualRace: string;
    yourSimulation: string;
    fullClassification: string;
  };

  chart: {
    title: string;
    selectDrivers: (n: number) => string;
    tireChange: string;
    position: string;
  };

  share: {
    heading: string;
    beatThis: string;
  };

  tiers: Record<string, string>;

  validation: {
    minPitStops: (n: number) => string;
    maxPitStops: (n: number) => string;
    compoundCount: (expected: number, pits: number) => string;
    minCompounds: (n: number) => string;
    pitOrder: string;
    pitTooEarly: (lap: number, min: number) => string;
    pitTooLate: (lap: number, max: number) => string;
    stintTooShort: (stint: number, len: number, min: number) => string;
  };
};
