import {
  Compound,
  DriverData,
  PositionChange,
  RaceData,
  SimOutput,
  SimResult,
  Stint,
  UserStrategy,
} from "./types";
import {
  TIRE_CONFIG,
  OVER_LIFETIME_PENALTY,
  TRAFFIC_THRESHOLDS,
  getTierForPosition,
} from "./constants";

export function userStrategyToStints(
  strategy: UserStrategy,
  totalLaps: number
): Stint[] {
  const stints: Stint[] = [];
  let startLap = 1;
  for (let i = 0; i < strategy.compounds.length; i++) {
    const endLap =
      i < strategy.pitLaps.length ? strategy.pitLaps[i] : totalLaps;
    stints.push({ startLap, endLap, compound: strategy.compounds[i] });
    startLap = endLap + 1;
  }
  return stints;
}

export function calculateLapTime(
  basePaceSec: number,
  compound: Compound,
  lapInStint: number,
  gapToCarAhead: number,
  isPitLap: boolean,
  pitLossSec: number
): number {
  const tire = TIRE_CONFIG[compound];

  let time = basePaceSec;
  time += tire.effect;
  time += tire.degradationPerLap * (lapInStint - 1);

  if (lapInStint > tire.lifetime) {
    time += OVER_LIFETIME_PENALTY;
  }

  if (gapToCarAhead > 0) {
    for (const threshold of TRAFFIC_THRESHOLDS) {
      if (gapToCarAhead < threshold.maxGap) {
        time += threshold.penalty;
        break;
      }
    }
  }

  if (isPitLap) {
    time += pitLossSec;
  }

  return time;
}

function findCurrentStint(stints: Stint[], lap: number): Stint | undefined {
  return stints.find((s) => lap >= s.startLap && lap <= s.endLap);
}

export function simulateRace(
  raceData: RaceData,
  challengeDriverId: string,
  userStrategy: UserStrategy
): SimOutput {
  const { race, drivers } = raceData;

  const strategiesMap = new Map<string, Stint[]>();
  for (const driver of drivers) {
    if (driver.id === challengeDriverId) {
      strategiesMap.set(
        driver.id,
        userStrategyToStints(userStrategy, race.totalLaps)
      );
    } else {
      strategiesMap.set(driver.id, driver.defaultStrategy);
    }
  }

  const cumulativeTimes = new Map<string, number>();
  const allLapTimes = new Map<string, number[]>();
  for (const driver of drivers) {
    cumulativeTimes.set(driver.id, 0);
    allLapTimes.set(driver.id, []);
  }

  const challengePositionsPerLap: number[] = [];
  const positionChanges: PositionChange[] = [];
  let prevChallengePosition = drivers.find(
    (d) => d.id === challengeDriverId
  )!.gridPosition;

  for (let lap = 1; lap <= race.totalLaps; lap++) {
    const sorted = [...drivers].sort(
      (a, b) => cumulativeTimes.get(a.id)! - cumulativeTimes.get(b.id)!
    );

    const positionMap = new Map<string, number>();
    sorted.forEach((d, i) => positionMap.set(d.id, i + 1));

    for (const driver of drivers) {
      const stints = strategiesMap.get(driver.id)!;
      const currentStint = findCurrentStint(stints, lap);
      if (!currentStint) continue;

      const lapInStint = lap - currentStint.startLap + 1;
      const isPitLap = stints.some(
        (s) => s.endLap === lap && s !== stints[stints.length - 1]
      );

      const position = positionMap.get(driver.id) ?? 1;
      let gapToCarAhead = 0;
      if (position > 1) {
        const driverAhead = sorted[position - 2];
        gapToCarAhead =
          cumulativeTimes.get(driver.id)! -
          cumulativeTimes.get(driverAhead.id)!;
      }

      const lapTime = calculateLapTime(
        driver.basePaceSec,
        currentStint.compound,
        lapInStint,
        gapToCarAhead,
        isPitLap,
        race.pitLossSec
      );

      cumulativeTimes.set(
        driver.id,
        cumulativeTimes.get(driver.id)! + lapTime
      );
      allLapTimes.get(driver.id)!.push(lapTime);
    }

    const sortedAfterLap = [...drivers].sort(
      (a, b) => cumulativeTimes.get(a.id)! - cumulativeTimes.get(b.id)!
    );
    const challengePosition =
      sortedAfterLap.findIndex((d) => d.id === challengeDriverId) + 1;
    challengePositionsPerLap.push(challengePosition);

    if (challengePosition !== prevChallengePosition) {
      const stints = strategiesMap.get(challengeDriverId)!;
      const isPitLap = stints.some(
        (s) =>
          s.endLap === lap && s !== stints[stints.length - 1]
      );

      if (challengePosition < prevChallengePosition) {
        const overtakenIdx = prevChallengePosition - 2;
        const overtakenDriver =
          overtakenIdx >= 0 && overtakenIdx < sortedAfterLap.length
            ? sortedAfterLap[challengePosition]?.name ?? "Unknown"
            : "Unknown";

        positionChanges.push({
          lap,
          newPosition: challengePosition,
          oldPosition: prevChallengePosition,
          overtakenDriverName: overtakenDriver,
          isPitLap,
        });
      }
      prevChallengePosition = challengePosition;
    }
  }

  const finalSorted = [...drivers].sort(
    (a, b) => cumulativeTimes.get(a.id)! - cumulativeTimes.get(b.id)!
  );
  const finalPosition =
    finalSorted.findIndex((d) => d.id === challengeDriverId) + 1;

  const allDriverResults = finalSorted.map((d, i) => ({
    driverId: d.id,
    finalPosition: i + 1,
  }));

  return {
    finalPosition,
    totalTimeSec: cumulativeTimes.get(challengeDriverId)!,
    lapTimes: allLapTimes.get(challengeDriverId)!,
    positionsPerLap: challengePositionsPerLap,
    positionChanges,
    allDriverResults,
  };
}

export function computeResult(
  simOutput: SimOutput,
  baselineOutput: SimOutput,
  originalPosition: number,
  userStrategy: UserStrategy
): SimResult {
  const positionsGained = originalPosition - simOutput.finalPosition;
  const timeDelta = baselineOutput.totalTimeSec - simOutput.totalTimeSec;
  const score = Math.round(
    positionsGained * 100 + timeDelta * 10 - userStrategy.pitLaps.length * 50
  );

  const tier = getTierForPosition(simOutput.finalPosition);

  let keyMoment: string;
  if (simOutput.positionChanges.length > 0) {
    const best = simOutput.positionChanges.reduce((a, b) =>
      b.oldPosition - b.newPosition > a.oldPosition - a.newPosition ? b : a
    );
    const verb = best.isPitLap ? "Undercut on" : "Passed on";
    keyMoment = `${verb} Lap ${best.lap} jumped ${best.overtakenDriverName} for P${best.newPosition}`;
  } else {
    keyMoment = "No position changes — try a different strategy";
  }

  return {
    finalPosition: simOutput.finalPosition,
    originalPosition,
    positionsGained,
    totalTimeSec: simOutput.totalTimeSec,
    lapTimes: simOutput.lapTimes,
    positionsPerLap: simOutput.positionsPerLap,
    score,
    keyMoment,
    tier,
    allDriverResults: simOutput.allDriverResults,
  };
}
