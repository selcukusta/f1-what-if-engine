import { describe, it, expect } from "vitest";
import {
  calculateLapTime,
  userStrategyToStints,
  simulateRace,
  computeResult,
} from "@/engine/simulate";
import { RaceData, UserStrategy, Stint } from "@/engine/types";

describe("userStrategyToStints", () => {
  it("converts a 1-stop strategy to stints", () => {
    const strategy: UserStrategy = {
      pitLaps: [25],
      compounds: ["soft", "hard"],
    };
    const stints = userStrategyToStints(strategy, 78);
    expect(stints).toEqual([
      { startLap: 1, endLap: 25, compound: "soft" },
      { startLap: 26, endLap: 78, compound: "hard" },
    ]);
  });

  it("converts a 2-stop strategy to stints", () => {
    const strategy: UserStrategy = {
      pitLaps: [20, 50],
      compounds: ["medium", "hard", "soft"],
    };
    const stints = userStrategyToStints(strategy, 78);
    expect(stints).toEqual([
      { startLap: 1, endLap: 20, compound: "medium" },
      { startLap: 21, endLap: 50, compound: "hard" },
      { startLap: 51, endLap: 78, compound: "soft" },
    ]);
  });
});

describe("calculateLapTime", () => {
  // Helper: raceLap=1, no car ahead, not pit, first stint (isolates tire math)
  const base = (compound: Parameters<typeof calculateLapTime>[1], lapInStint: number) =>
    calculateLapTime(80, compound, lapInStint, 1, 0, 0, false, 22, true);

  it("returns basePace + tire effect on lap 1 of stint (no degradation)", () => {
    const time = base("soft", 1);
    expect(time).toBeCloseTo(80 - 1.2 - 0.03, 5);
  });

  it("accumulates degradation over laps", () => {
    const lap1 = base("soft", 1);
    const lap10 = base("soft", 10);
    expect(lap10 - lap1).toBeCloseTo(0.3 * 9, 5);
  });

  it("adds over-lifetime penalty for soft after 15 laps", () => {
    const lap15 = base("soft", 15);
    const lap16 = base("soft", 16);
    expect(lap16 - lap15).toBeCloseTo(0.3 + 2.0, 5);
  });

  it("adds fuel burn effect over race laps", () => {
    const lap1 = calculateLapTime(80, "medium", 1, 1, 0, 0, false, 22, true);
    const lap50 = calculateLapTime(80, "medium", 1, 50, 0, 0, false, 22, true);
    expect(lap1 - lap50).toBeCloseTo(49 * 0.03, 5);
  });

  it("adds cold tire penalty on first lap of non-first stint", () => {
    const firstStint = calculateLapTime(80, "medium", 1, 10, 0, 0, false, 22, true);
    const afterPit = calculateLapTime(80, "medium", 1, 10, 0, 0, false, 22, false);
    expect(afterPit - firstStint).toBeCloseTo(1.5, 5);
  });

  it("applies pace ceiling when close behind slower car", () => {
    // Car ahead doing 82s, our potential time is 79s (delta 3s > threshold 2s → passes)
    const fast = calculateLapTime(80, "soft", 1, 1, 0.5, 82, false, 22, true);
    expect(fast).toBeLessThan(82);

    // Car ahead doing 79.5s, our potential is ~78.77s (delta ~0.73s < 2s → blocked)
    const blocked = calculateLapTime(80, "soft", 1, 1, 0.5, 79.5, false, 22, true);
    expect(blocked).toBeCloseTo(79.5 + 0.2, 1);
  });

  it("increases tire degradation in dirty air", () => {
    // With dirty air (gap < 1.5), deg should be 1.2x
    const clean = calculateLapTime(80, "soft", 10, 1, 0, 0, false, 22, true);
    const dirty = calculateLapTime(80, "soft", 10, 1, 1.0, 90, false, 22, true);
    // dirty air deg: 0.3 * 1.2 = 0.36/lap, so 9 extra laps: 9 * (0.36-0.3) = 0.54 more
    // but also pace ceiling may apply — just check dirty is slower
    expect(dirty).toBeGreaterThan(clean);
  });

  it("adds pit loss on pit laps", () => {
    const normal = calculateLapTime(80, "medium", 1, 1, 0, 0, false, 22, true);
    const pitLap = calculateLapTime(80, "medium", 1, 1, 0, 0, true, 22, true);
    expect(pitLap - normal).toBeCloseTo(22, 5);
  });
});

const testRaceData: RaceData = {
  race: { name: "Test GP", year: 2024, totalLaps: 10, pitLossSec: 20 },
  drivers: [
    {
      id: "D1",
      name: "Driver One",
      team: "Team A",
      teamColor: "#FF0000",
      number: 1,
      gridPosition: 1,
      basePaceSec: 80,
      defaultStrategy: [
        { startLap: 1, endLap: 5, compound: "medium" },
        { startLap: 6, endLap: 10, compound: "hard" },
      ],
    },
    {
      id: "D2",
      name: "Driver Two",
      team: "Team B",
      teamColor: "#0000FF",
      number: 2,
      gridPosition: 2,
      basePaceSec: 80.3,
      defaultStrategy: [
        { startLap: 1, endLap: 5, compound: "medium" },
        { startLap: 6, endLap: 10, compound: "hard" },
      ],
    },
    {
      id: "D3",
      name: "Driver Three",
      team: "Team C",
      teamColor: "#00FF00",
      number: 3,
      gridPosition: 3,
      basePaceSec: 80.6,
      defaultStrategy: [
        { startLap: 1, endLap: 6, compound: "soft" },
        { startLap: 7, endLap: 10, compound: "hard" },
      ],
    },
  ],
};

describe("simulateRace", () => {
  it("is deterministic — same input produces same output", () => {
    const strategy: UserStrategy = {
      pitLaps: [5],
      compounds: ["soft", "hard"],
    };
    const result1 = simulateRace(testRaceData, "D3", strategy);
    const result2 = simulateRace(testRaceData, "D3", strategy);
    expect(result1.finalPosition).toBe(result2.finalPosition);
    expect(result1.totalTimeSec).toBe(result2.totalTimeSec);
  });

  it("produces lap times array matching total laps", () => {
    const strategy: UserStrategy = {
      pitLaps: [5],
      compounds: ["medium", "hard"],
    };
    const result = simulateRace(testRaceData, "D3", strategy);
    expect(result.lapTimes).toHaveLength(10);
  });

  it("produces positions-per-lap array matching total laps", () => {
    const strategy: UserStrategy = {
      pitLaps: [5],
      compounds: ["medium", "hard"],
    };
    const result = simulateRace(testRaceData, "D3", strategy);
    expect(result.positionsPerLap).toHaveLength(10);
  });

  it("all positions are between 1 and driver count", () => {
    const strategy: UserStrategy = {
      pitLaps: [5],
      compounds: ["medium", "hard"],
    };
    const result = simulateRace(testRaceData, "D3", strategy);
    for (const pos of result.positionsPerLap) {
      expect(pos).toBeGreaterThanOrEqual(1);
      expect(pos).toBeLessThanOrEqual(3);
    }
  });

  it("faster driver stays ahead when strategies are equal", () => {
    const strategy: UserStrategy = {
      pitLaps: [5],
      compounds: ["medium", "hard"],
    };
    const result = simulateRace(testRaceData, "D2", strategy);
    expect(result.finalPosition).toBeGreaterThan(1);
  });
});

describe("computeResult", () => {
  it("calculates positions gained correctly", () => {
    const strategy: UserStrategy = {
      pitLaps: [5],
      compounds: ["soft", "hard"],
    };
    const simOutput = simulateRace(testRaceData, "D3", strategy);
    const baselineOutput = simulateRace(testRaceData, "D3", {
      pitLaps: [6],
      compounds: ["soft", "hard"],
    });
    const result = computeResult(simOutput, baselineOutput, 3, strategy);
    expect(result.positionsGained).toBe(3 - result.finalPosition);
  });

  it("assigns a tier based on final position", () => {
    const strategy: UserStrategy = {
      pitLaps: [5],
      compounds: ["soft", "hard"],
    };
    const simOutput = simulateRace(testRaceData, "D3", strategy);
    const baselineOutput = simulateRace(testRaceData, "D3", {
      pitLaps: [6],
      compounds: ["soft", "hard"],
    });
    const result = computeResult(simOutput, baselineOutput, 3, strategy);
    expect(result.tier).toBeDefined();
    expect(typeof result.tier).toBe("string");
  });

  it("produces positionChanges array", () => {
    const strategy: UserStrategy = {
      pitLaps: [5],
      compounds: ["soft", "hard"],
    };
    const simOutput = simulateRace(testRaceData, "D3", strategy);
    const baselineOutput = simulateRace(testRaceData, "D3", {
      pitLaps: [6],
      compounds: ["soft", "hard"],
    });
    const result = computeResult(simOutput, baselineOutput, 3, strategy);
    expect(result.positionChanges).toBeDefined();
    expect(Array.isArray(result.positionChanges)).toBe(true);
    for (const pc of result.positionChanges) {
      expect(pc.kind).toBeDefined();
      expect(pc.lap).toBeGreaterThan(0);
    }
  });
});
