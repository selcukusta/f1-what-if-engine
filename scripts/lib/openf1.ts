const API_BASE = "https://api.openf1.org/v1";

export type ApiLap = {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  is_pit_out_lap: boolean;
};

export type ApiDriver = {
  driver_number: number;
  full_name: string;
  broadcast_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
};

export type ApiStint = {
  driver_number: number;
  stint_number: number;
  compound: string;
  lap_start: number;
  lap_end: number;
  tyre_age_at_start: number;
};

export type RaceConfig = {
  sessionKey: number;
  name: string;
  year: number;
  totalLaps: number;
  pitLossSec: number;
  gridOrder: Record<number, number>;
  defaultStrategies: Record<number, { compound: string; endLap: number }[]>;
  actualFinishOrder: number[];
  outputFile: string;
  fallbackPace?: number;
};

export async function fetchJson<T>(url: string): Promise<T> {
  console.log(`Fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
  return res.json();
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeBasePace(
  laps: ApiLap[],
  driverNumber: number,
  pitLaps: Set<number>,
): number | null {
  const driverLaps = laps
    .filter(
      (l) =>
        l.driver_number === driverNumber &&
        l.lap_duration !== null &&
        l.lap_number > 2 &&
        !pitLaps.has(l.lap_number) &&
        !l.is_pit_out_lap,
    )
    .map((l) => l.lap_duration!);

  if (driverLaps.length < 5) return null;

  const med = median(driverLaps);
  const clean = driverLaps.filter((t) => t < med * 1.05);

  return clean.length > 0 ? Math.round(median(clean) * 1000) / 1000 : null;
}

function buildDriverName(apiDriver: ApiDriver | undefined, num: number): string {
  return apiDriver?.full_name
    ? apiDriver.full_name
        .split(" ")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    : `Driver ${num}`;
}

function extendStrategy(
  driverStints: { startLap: number; endLap: number; compound: string }[],
  totalLaps: number,
  driverNum: number,
) {
  const lastStint = driverStints[driverStints.length - 1];
  if (lastStint.endLap < totalLaps) {
    if (driverStints.length === 1) {
      const secondCompound = lastStint.compound === "hard" ? "medium" : "hard";
      const midLap = Math.round(totalLaps * 0.4);
      lastStint.endLap = midLap;
      driverStints.push({
        startLap: midLap + 1,
        endLap: totalLaps,
        compound: secondCompound,
      });
    } else {
      lastStint.endLap = totalLaps;
    }
    console.log(`  Extended strategy for driver ${driverNum} to cover full race`);
  }
}

export async function generateRaceData(config: RaceConfig) {
  const { sessionKey, totalLaps } = config;

  const [drivers, laps, stints] = await Promise.all([
    fetchJson<ApiDriver[]>(`${API_BASE}/drivers?session_key=${sessionKey}`),
    fetchJson<ApiLap[]>(`${API_BASE}/laps?session_key=${sessionKey}`),
    fetchJson<ApiStint[]>(`${API_BASE}/stints?session_key=${sessionKey}`),
  ]);

  const uniqueDrivers = new Map<number, ApiDriver>();
  for (const d of drivers) {
    uniqueDrivers.set(d.driver_number, d);
  }

  const pitLapsByDriver = new Map<number, Set<number>>();
  for (const stint of stints) {
    if (stint.stint_number > 1) {
      if (!pitLapsByDriver.has(stint.driver_number)) {
        pitLapsByDriver.set(stint.driver_number, new Set());
      }
      pitLapsByDriver.get(stint.driver_number)!.add(stint.lap_start);
      pitLapsByDriver.get(stint.driver_number)!.add(stint.lap_start - 1);
    }
  }

  const basePaces = new Map<number, number>();
  for (const [num] of uniqueDrivers) {
    const pLaps = pitLapsByDriver.get(num) ?? new Set();
    const pace = computeBasePace(laps, num, pLaps);
    if (pace !== null) {
      basePaces.set(num, pace);
    }
  }

  const lastLapByDriver = new Map<number, number>();
  for (const stint of stints) {
    const prev = lastLapByDriver.get(stint.driver_number) ?? 0;
    if (stint.lap_end > prev)
      lastLapByDriver.set(stint.driver_number, stint.lap_end);
  }
  const dnfThreshold = totalLaps * 0.8;
  const dnfNumbers = new Set<number>();
  for (const [num, lastLap] of lastLapByDriver) {
    if (lastLap < dnfThreshold) {
      dnfNumbers.add(num);
      const acronym = uniqueDrivers.get(num)?.name_acronym ?? `D${num}`;
      console.log(
        `  DNF: ${acronym} (#${num}) — retired lap ${lastLap}/${totalLaps}`,
      );
    }
  }

  const activeEntries = Object.entries(config.gridOrder)
    .filter(([numStr]) => !dnfNumbers.has(parseInt(numStr)))
    .sort(([, a], [, b]) => a - b);

  const dnfEntries = Object.entries(config.gridOrder)
    .filter(([numStr]) => dnfNumbers.has(parseInt(numStr)))
    .sort(([, a], [, b]) => a - b);

  const fallback = config.fallbackPace ?? 93.0;

  const activeDrivers = activeEntries.map(([numStr], idx) => {
    const num = parseInt(numStr);
    const apiDriver = uniqueDrivers.get(num);
    const strat = config.defaultStrategies[num] ?? [
      { compound: "medium", endLap: totalLaps },
    ];

    const driverStints: { startLap: number; endLap: number; compound: string }[] = [];
    let startLap = 1;
    for (const s of strat) {
      driverStints.push({
        startLap,
        endLap: Math.min(s.endLap, totalLaps),
        compound: s.compound.toLowerCase(),
      });
      startLap = s.endLap + 1;
    }
    extendStrategy(driverStints, totalLaps, num);

    return {
      id: apiDriver?.name_acronym ?? `D${num}`,
      name: buildDriverName(apiDriver, num),
      team: apiDriver?.team_name ?? "Unknown",
      teamColor: apiDriver?.team_colour
        ? `#${apiDriver.team_colour}`
        : "#FFFFFF",
      number: num,
      gridPosition: idx + 1,
      basePaceSec: basePaces.get(num) ?? fallback,
      defaultStrategy: driverStints,
    };
  });

  const dnfDriverEntries = dnfEntries.map(([numStr, gridPos]) => {
    const num = parseInt(numStr);
    const apiDriver = uniqueDrivers.get(num);
    return {
      id: apiDriver?.name_acronym ?? `D${num}`,
      name: buildDriverName(apiDriver, num),
      team: apiDriver?.team_name ?? "Unknown",
      teamColor: apiDriver?.team_colour
        ? `#${apiDriver.team_colour}`
        : "#FFFFFF",
      number: num,
      gridPosition: gridPos,
      basePaceSec: 0,
      defaultStrategy: [] as { startLap: number; endLap: number; compound: string }[],
      dnf: true,
    };
  });

  const raceData = {
    race: {
      name: config.name,
      year: config.year,
      totalLaps,
      pitLossSec: config.pitLossSec,
    },
    drivers: [...activeDrivers, ...dnfDriverEntries],
    actualOrder: config.actualFinishOrder.map(
      (num) => uniqueDrivers.get(num)?.name_acronym ?? `D${num}`,
    ),
  };

  const outPath = new URL(`../src/data/${config.outputFile}`, import.meta.url);
  const { writeFileSync, mkdirSync } = await import("fs");
  const { dirname } = await import("path");
  const { fileURLToPath } = await import("url");
  const filePath = fileURLToPath(outPath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(raceData, null, 2));

  console.log(`\nWrote ${raceData.drivers.length} drivers to ${filePath}`);
  console.log("Base paces:");
  for (const d of raceData.drivers) {
    if (!("dnf" in d)) {
      console.log(`  ${d.id} (P${d.gridPosition}): ${d.basePaceSec}s`);
    }
  }
}
