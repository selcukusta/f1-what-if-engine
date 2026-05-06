import {
  ButterflyEffect,
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
  FUEL_BURN_PER_LAP,
  COLD_TIRE_PENALTY,
  DIRTY_AIR_DEG_MULTIPLIER,
  DIRTY_AIR_MARGIN,
  OVERTAKE_DELTA_REQUIRED,
  getTierForResult,
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

type TrackPhysics = {
  overtakeDelta: number;
  dirtyAirMargin: number;
  fuelBurnPerLap: number;
  coldTirePenalty: number;
  dirtyAirDegMultiplier: number;
};

export function calculateLapTime(
  basePaceSec: number,
  compound: Compound,
  lapInStint: number,
  raceLap: number,
  gapToCarAhead: number,
  carAheadLapTime: number,
  isPitLap: boolean,
  pitLossSec: number,
  isFirstStint: boolean,
  physics: TrackPhysics,
): number {
  const tire = TIRE_CONFIG[compound];

  let time = basePaceSec;
  time += tire.effect;

  const inDirtyAir = gapToCarAhead > 0 && gapToCarAhead < 1.5;
  const degRate = inDirtyAir
    ? tire.degradationPerLap * physics.dirtyAirDegMultiplier
    : tire.degradationPerLap;
  time += degRate * (lapInStint - 1);

  if (lapInStint > tire.lifetime) {
    time += OVER_LIFETIME_PENALTY;
  }

  time -= raceLap * physics.fuelBurnPerLap;

  if (lapInStint === 1 && !isFirstStint) {
    time += physics.coldTirePenalty;
  }

  if (gapToCarAhead > 0 && gapToCarAhead < 1.5 && carAheadLapTime > 0) {
    const paceDelta = carAheadLapTime - time;
    if (paceDelta > 0 && paceDelta < physics.overtakeDelta) {
      time = carAheadLapTime + physics.dirtyAirMargin;
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
  const physics: TrackPhysics = {
    overtakeDelta: race.overtakeDelta ?? OVERTAKE_DELTA_REQUIRED,
    dirtyAirMargin: race.dirtyAirMargin ?? DIRTY_AIR_MARGIN,
    fuelBurnPerLap: race.fuelBurnPerLap ?? FUEL_BURN_PER_LAP,
    coldTirePenalty: race.coldTirePenalty ?? COLD_TIRE_PENALTY,
    dirtyAirDegMultiplier: race.dirtyAirDegMultiplier ?? DIRTY_AIR_DEG_MULTIPLIER,
  };

  const activeDrivers = drivers.filter((d) => !d.dnf);

  const strategiesMap = new Map<string, Stint[]>();
  for (const driver of activeDrivers) {
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
  const lastLapTime = new Map<string, number>();
  for (const driver of activeDrivers) {
    cumulativeTimes.set(driver.id, 0);
    allLapTimes.set(driver.id, []);
    lastLapTime.set(driver.id, 0);
  }

  const challengePositionsPerLap: number[] = [];
  const driverPositionsPerLap = new Map<string, number[]>();
  for (const driver of activeDrivers) {
    driverPositionsPerLap.set(driver.id, []);
  }
  const positionChanges: PositionChange[] = [];
  let prevChallengePosition = activeDrivers.find(
    (d) => d.id === challengeDriverId
  )!.gridPosition;

  for (let lap = 1; lap <= race.totalLaps; lap++) {
    const sorted = [...activeDrivers].sort(
      (a, b) => cumulativeTimes.get(a.id)! - cumulativeTimes.get(b.id)!
    );

    const positionMap = new Map<string, number>();
    sorted.forEach((d, i) => positionMap.set(d.id, i + 1));

    for (const driver of activeDrivers) {
      const stints = strategiesMap.get(driver.id)!;
      const currentStint = findCurrentStint(stints, lap);
      if (!currentStint) continue;

      const lapInStint = lap - currentStint.startLap + 1;
      const isPitLap = stints.some(
        (s) => s.endLap === lap && s !== stints[stints.length - 1]
      );

      const position = positionMap.get(driver.id) ?? 1;
      let gapToCarAhead = 0;
      let carAheadLapTime = 0;
      if (position > 1) {
        const driverAhead = sorted[position - 2];
        gapToCarAhead =
          cumulativeTimes.get(driver.id)! -
          cumulativeTimes.get(driverAhead.id)!;
        carAheadLapTime = lastLapTime.get(driverAhead.id) ?? 0;
      }

      const isFirstStint = currentStint === stints[0];

      const lapTime = calculateLapTime(
        driver.basePaceSec,
        currentStint.compound,
        lapInStint,
        lap,
        gapToCarAhead,
        carAheadLapTime,
        isPitLap,
        race.pitLossSec,
        isFirstStint,
        physics,
      );

      cumulativeTimes.set(
        driver.id,
        cumulativeTimes.get(driver.id)! + lapTime
      );
      allLapTimes.get(driver.id)!.push(lapTime);
      lastLapTime.set(driver.id, lapTime);
    }

    const sortedAfterLap = [...activeDrivers].sort(
      (a, b) => cumulativeTimes.get(a.id)! - cumulativeTimes.get(b.id)!
    );
    const challengePosition =
      sortedAfterLap.findIndex((d) => d.id === challengeDriverId) + 1;
    challengePositionsPerLap.push(challengePosition);
    sortedAfterLap.forEach((d, i) => {
      driverPositionsPerLap.get(d.id)!.push(i + 1);
    });

    if (challengePosition !== prevChallengePosition) {
      const challengeStints = strategiesMap.get(challengeDriverId)!;
      const challengePitting = challengeStints.some(
        (s) => s.endLap === lap && s !== challengeStints[challengeStints.length - 1]
      );
      const challengeStint = findCurrentStint(challengeStints, lap);
      const challengeLapInStint = challengeStint ? lap - challengeStint.startLap + 1 : 0;
      const challengeTireLife = challengeStint
        ? TIRE_CONFIG[challengeStint.compound].lifetime
        : Infinity;

      if (challengePosition < prevChallengePosition) {
        for (let pos = challengePosition; pos < prevChallengePosition; pos++) {
          const other = sorted.find(
            (d) => positionMap.get(d.id) === pos && d.id !== challengeDriverId
          );
          const otherId = other?.id;
          const otherPitting = otherId
            ? strategiesMap.get(otherId)!.some(
                (s) => s.endLap === lap && s !== strategiesMap.get(otherId!)![strategiesMap.get(otherId!)!.length - 1]
              )
            : false;

          let kind: PositionChange["kind"];
          if (challengePitting) {
            kind = "undercut";
          } else if (otherPitting) {
            kind = "overcut";
          } else {
            kind = "overtake";
          }

          positionChanges.push({
            lap,
            newPosition: pos,
            oldPosition: pos + 1,
            otherDriverName: other?.name ?? "Unknown",
            kind,
          });
        }
      } else {
        for (let pos = prevChallengePosition; pos < challengePosition; pos++) {
          const other = sortedAfterLap.find(
            (d, i) => i + 1 === pos && d.id !== challengeDriverId
          );

          let kind: PositionChange["kind"];
          if (challengePitting) {
            kind = "lost-position";
          } else if (challengeLapInStint > challengeTireLife) {
            kind = "tire-cliff";
          } else {
            kind = "lost-position";
          }

          positionChanges.push({
            lap,
            newPosition: challengePosition,
            oldPosition: prevChallengePosition,
            otherDriverName: other?.name ?? "Unknown",
            kind,
          });
        }
      }
      prevChallengePosition = challengePosition;
    }
  }

  const finalSorted = [...activeDrivers].sort(
    (a, b) => cumulativeTimes.get(a.id)! - cumulativeTimes.get(b.id)!
  );
  const finalPosition =
    finalSorted.findIndex((d) => d.id === challengeDriverId) + 1;

  const allDriverResults = finalSorted.map((d, i) => ({
    driverId: d.id,
    finalPosition: i + 1,
  }));

  const allPositionsPerLap = activeDrivers.map((d) => ({
    driverId: d.id,
    positions: driverPositionsPerLap.get(d.id)!,
  }));

  return {
    finalPosition,
    totalTimeSec: cumulativeTimes.get(challengeDriverId)!,
    lapTimes: allLapTimes.get(challengeDriverId)!,
    positionsPerLap: challengePositionsPerLap,
    positionChanges,
    allDriverResults,
    allPositionsPerLap,
  };
}

function computeButterflyEffect(
  simResults: { driverId: string; finalPosition: number }[],
  baselineResults: { driverId: string; finalPosition: number }[],
  challengeDriverId: string,
  drivers: DriverData[],
): ButterflyEffect | null {
  const baselineMap = new Map(baselineResults.map((r) => [r.driverId, r.finalPosition]));
  const driverMap = new Map(drivers.map((d) => [d.id, d]));

  let best: ButterflyEffect | null = null;
  let maxDelta = 0;

  for (const result of simResults) {
    if (result.driverId === challengeDriverId) continue;
    const baseline = baselineMap.get(result.driverId);
    if (baseline === undefined) continue;
    const absDelta = Math.abs(baseline - result.finalPosition);
    if (absDelta > maxDelta) {
      maxDelta = absDelta;
      const driver = driverMap.get(result.driverId);
      best = {
        driverId: result.driverId,
        driverName: driver?.name ?? result.driverId,
        teamColor: driver?.teamColor ?? "#fff",
        baselinePosition: baseline,
        newPosition: result.finalPosition,
        positionDelta: baseline - result.finalPosition,
      };
    }
  }

  return best;
}

export function computeResult(
  simOutput: SimOutput,
  baselineOutput: SimOutput,
  originalPosition: number,
  targetPosition: number,
  userStrategy: UserStrategy,
  challengeDriverId: string,
  drivers: DriverData[],
): SimResult {
  const positionsGained = originalPosition - simOutput.finalPosition;
  const timeDelta = baselineOutput.totalTimeSec - simOutput.totalTimeSec;
  const score = Math.round(
    positionsGained * 100 + timeDelta * 10 - userStrategy.pitLaps.length * 50
  );

  const tier = getTierForResult(simOutput.finalPosition, originalPosition, targetPosition);

  const byLap = new Map<number, PositionChange>();
  for (const pc of simOutput.positionChanges) {
    const existing = byLap.get(pc.lap);
    if (!existing || Math.abs(pc.newPosition - pc.oldPosition) > Math.abs(existing.newPosition - existing.oldPosition)) {
      byLap.set(pc.lap, pc);
    }
  }
  const positionChanges = [...byLap.values()].sort((a, b) => a.lap - b.lap);

  const butterflyEffect = computeButterflyEffect(
    simOutput.allDriverResults,
    baselineOutput.allDriverResults,
    challengeDriverId,
    drivers,
  );

  return {
    finalPosition: simOutput.finalPosition,
    originalPosition,
    positionsGained,
    totalTimeSec: simOutput.totalTimeSec,
    lapTimes: simOutput.lapTimes,
    positionsPerLap: simOutput.positionsPerLap,
    score,
    positionChanges,
    tier,
    allDriverResults: simOutput.allDriverResults,
    allPositionsPerLap: simOutput.allPositionsPerLap,
    butterflyEffect,
  };
}
