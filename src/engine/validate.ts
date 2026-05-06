import { Challenge, UserStrategy, ValidationError } from "./types";

export function validateStrategy(
  strategy: UserStrategy,
  challenge: Challenge,
  totalLaps: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const { pitLaps, compounds } = strategy;
  const { rules, maxPitStops } = challenge;

  if (pitLaps.length < rules.minPitStops) {
    errors.push({
      field: "pitLaps",
      message: `At least ${rules.minPitStops} pit stop required`,
    });
  }

  if (pitLaps.length > maxPitStops) {
    errors.push({
      field: "pitLaps",
      message: `Maximum ${maxPitStops} pit stops allowed`,
    });
  }

  if (compounds.length !== pitLaps.length + 1) {
    errors.push({
      field: "compounds",
      message: `Expected ${pitLaps.length + 1} compounds for ${pitLaps.length} pit stops`,
    });
  }

  const uniqueCompounds = new Set(compounds);
  if (uniqueCompounds.size < rules.minCompounds) {
    errors.push({
      field: "compounds",
      message: `Must use at least ${rules.minCompounds} different compounds`,
    });
  }

  for (let i = 1; i < pitLaps.length; i++) {
    if (pitLaps[i] <= pitLaps[i - 1]) {
      errors.push({
        field: "pitLaps",
        message: "Pit laps must be in ascending order",
      });
      break;
    }
  }

  const minLap = 2;
  const maxLap = totalLaps - 5;
  for (const lap of pitLaps) {
    if (lap < minLap) {
      errors.push({
        field: "pitLaps",
        message: `Pit lap ${lap} is too early (minimum lap ${minLap})`,
      });
    }
    if (lap > maxLap) {
      errors.push({
        field: "pitLaps",
        message: `Pit lap ${lap} is too late (maximum lap ${maxLap})`,
      });
    }
  }

  const stintBoundaries = [1, ...pitLaps.map((l) => l + 1)];
  const stintEnds = [...pitLaps, totalLaps];
  for (let i = 0; i < stintBoundaries.length; i++) {
    const stintLength = stintEnds[i] - stintBoundaries[i] + 1;
    if (stintLength < rules.minLapsBetweenStops) {
      errors.push({
        field: "pitLaps",
        message: `Stint ${i + 1} is only ${stintLength} laps (minimum ${rules.minLapsBetweenStops})`,
      });
    }
  }

  return errors;
}
