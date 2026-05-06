import { describe, it, expect } from "vitest";
import { validateStrategy } from "@/engine/validate";
import { Challenge, UserStrategy } from "@/engine/types";

const challenge: Challenge = {
  id: "test",
  title: "Test",
  description: "Test",
  raceId: "test",
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

const totalLaps = 78;

describe("validateStrategy", () => {
  it("accepts a valid 1-stop strategy", () => {
    const strategy: UserStrategy = {
      pitLaps: [25],
      compounds: ["soft", "hard"],
    };
    const errors = validateStrategy(strategy, challenge, totalLaps);
    expect(errors).toEqual([]);
  });

  it("accepts a valid 2-stop strategy", () => {
    const strategy: UserStrategy = {
      pitLaps: [20, 50],
      compounds: ["soft", "medium", "hard"],
    };
    const errors = validateStrategy(strategy, challenge, totalLaps);
    expect(errors).toEqual([]);
  });

  it("rejects zero pit stops", () => {
    const strategy: UserStrategy = {
      pitLaps: [],
      compounds: ["medium"],
    };
    const errors = validateStrategy(strategy, challenge, totalLaps);
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "pitLaps" })
    );
  });

  it("rejects more than maxPitStops", () => {
    const strategy: UserStrategy = {
      pitLaps: [15, 30, 50],
      compounds: ["soft", "medium", "hard", "soft"],
    };
    const errors = validateStrategy(strategy, challenge, totalLaps);
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "pitLaps" })
    );
  });

  it("rejects single compound", () => {
    const strategy: UserStrategy = {
      pitLaps: [30],
      compounds: ["medium", "medium"],
    };
    const errors = validateStrategy(strategy, challenge, totalLaps);
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "compounds" })
    );
  });

  it("rejects mismatched compounds length", () => {
    const strategy: UserStrategy = {
      pitLaps: [25],
      compounds: ["soft", "medium", "hard"],
    };
    const errors = validateStrategy(strategy, challenge, totalLaps);
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "compounds" })
    );
  });

  it("rejects stint shorter than minLapsBetweenStops", () => {
    const strategy: UserStrategy = {
      pitLaps: [3],
      compounds: ["soft", "hard"],
    };
    const errors = validateStrategy(strategy, challenge, totalLaps);
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "pitLaps" })
    );
  });

  it("rejects pit lap too early (before lap 2)", () => {
    const strategy: UserStrategy = {
      pitLaps: [1],
      compounds: ["soft", "hard"],
    };
    const errors = validateStrategy(strategy, challenge, totalLaps);
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "pitLaps" })
    );
  });

  it("rejects pit lap too late (last 5 laps)", () => {
    const strategy: UserStrategy = {
      pitLaps: [75],
      compounds: ["soft", "hard"],
    };
    const errors = validateStrategy(strategy, challenge, totalLaps);
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "pitLaps" })
    );
  });

  it("rejects pit laps not in ascending order", () => {
    const strategy: UserStrategy = {
      pitLaps: [40, 20],
      compounds: ["soft", "hard", "medium"],
    };
    const errors = validateStrategy(strategy, challenge, totalLaps);
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "pitLaps" })
    );
  });

  it("rejects two pit stops too close together", () => {
    const strategy: UserStrategy = {
      pitLaps: [20, 23],
      compounds: ["soft", "medium", "hard"],
    };
    const errors = validateStrategy(strategy, challenge, totalLaps);
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "pitLaps" })
    );
  });
});
