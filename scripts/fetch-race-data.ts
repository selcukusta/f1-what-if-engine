const SESSION_KEY = 9523;
const API_BASE = "https://api.openf1.org/v1";

type ApiLap = {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  is_pit_out_lap: boolean;
};

type ApiDriver = {
  driver_number: number;
  broadcast_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
};

type ApiStint = {
  driver_number: number;
  stint_number: number;
  compound: string;
  lap_start: number;
  lap_end: number;
  tyre_age_at_start: number;
};

type ApiPosition = {
  driver_number: number;
  position: number;
  date: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  console.log(`Fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
  return res.json();
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeBasePace(
  laps: ApiLap[],
  driverNumber: number,
  pitLaps: Set<number>
): number | null {
  const driverLaps = laps
    .filter(
      (l) =>
        l.driver_number === driverNumber &&
        l.lap_duration !== null &&
        l.lap_number > 2 &&
        !pitLaps.has(l.lap_number) &&
        !l.is_pit_out_lap
    )
    .map((l) => l.lap_duration!);

  if (driverLaps.length < 5) return null;

  const med = median(driverLaps);
  const clean = driverLaps.filter((t) => t < med * 1.05);

  return clean.length > 0
    ? Math.round(median(clean) * 1000) / 1000
    : null;
}

const DRIVER_GRID_ORDER: Record<number, number> = {
  16: 1,  // LEC
  81: 2,  // PIA
  55: 3,  // SAI
  4: 4,   // NOR
  63: 5,  // RUS
  1: 6,   // VER
  44: 7,  // HAM
  22: 8,  // TSU
  23: 9,  // ALB
  10: 10, // GAS
  31: 11, // OCO
  3: 12,  // RIC
  18: 13, // STR
  14: 14, // ALO
  2: 15,  // SAR
  11: 16, // PER
  77: 17, // BOT
  24: 18, // ZHO
  27: 19, // HUL
  20: 20, // MAG
};

const DNF_DRIVERS = new Set([11, 31, 27, 20]); // PER, OCO, HUL, MAG

const DEFAULT_STRATEGIES: Record<number, { compound: string; endLap: number }[]> = {
  16: [{ compound: "medium", endLap: 30 }, { compound: "hard", endLap: 78 }],
  81: [{ compound: "medium", endLap: 28 }, { compound: "hard", endLap: 78 }],
  55: [{ compound: "medium", endLap: 32 }, { compound: "hard", endLap: 78 }],
  4:  [{ compound: "medium", endLap: 29 }, { compound: "hard", endLap: 78 }],
  63: [{ compound: "medium", endLap: 31 }, { compound: "hard", endLap: 78 }],
  1:  [{ compound: "hard", endLap: 33 }, { compound: "medium", endLap: 78 }],
  44: [{ compound: "hard", endLap: 35 }, { compound: "medium", endLap: 78 }],
  22: [{ compound: "medium", endLap: 27 }, { compound: "hard", endLap: 78 }],
  23: [{ compound: "hard", endLap: 35 }, { compound: "medium", endLap: 78 }],
  10: [{ compound: "medium", endLap: 30 }, { compound: "hard", endLap: 78 }],
  31: [{ compound: "medium", endLap: 28 }, { compound: "hard", endLap: 78 }],
  3:  [{ compound: "hard", endLap: 34 }, { compound: "medium", endLap: 78 }],
  18: [{ compound: "medium", endLap: 26 }, { compound: "hard", endLap: 78 }],
  14: [{ compound: "hard", endLap: 36 }, { compound: "medium", endLap: 78 }],
  2:  [{ compound: "hard", endLap: 38 }, { compound: "medium", endLap: 78 }],
  11: [{ compound: "medium", endLap: 31 }, { compound: "hard", endLap: 78 }],
  77: [{ compound: "hard", endLap: 35 }, { compound: "medium", endLap: 78 }],
  24: [{ compound: "medium", endLap: 29 }, { compound: "hard", endLap: 78 }],
  27: [{ compound: "hard", endLap: 33 }, { compound: "medium", endLap: 78 }],
  20: [{ compound: "hard", endLap: 34 }, { compound: "medium", endLap: 78 }],
};

const TEAMMATE_MAP: Record<number, number> = {
  11: 1,  // PER → VER
  31: 10, // OCO → GAS
  27: 20, // HUL → MAG (both DNF, use midfield estimate)
  20: 27, // MAG → HUL
};

const DNF_PACE_OFFSETS: Record<number, number> = {
  11: 0.5,  // PER is ~0.5s slower than VER
  31: 0.2,  // OCO is ~0.2s slower than GAS
  27: 0.0,  // HUL — use midfield estimate
  20: 0.3,  // MAG ~0.3s slower than HUL
};

async function main() {
  const [drivers, laps, stints] = await Promise.all([
    fetchJson<ApiDriver[]>(`${API_BASE}/drivers?session_key=${SESSION_KEY}`),
    fetchJson<ApiLap[]>(`${API_BASE}/laps?session_key=${SESSION_KEY}`),
    fetchJson<ApiStint[]>(`${API_BASE}/stints?session_key=${SESSION_KEY}`),
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
    const pitLaps = pitLapsByDriver.get(num) ?? new Set();
    const pace = computeBasePace(laps, num, pitLaps);
    if (pace !== null) {
      basePaces.set(num, pace);
    }
  }

  for (const dnfNum of DNF_DRIVERS) {
    if (!basePaces.has(dnfNum)) {
      const teammateNum = TEAMMATE_MAP[dnfNum];
      const teammatePace = basePaces.get(teammateNum);
      if (teammatePace) {
        basePaces.set(dnfNum, teammatePace + DNF_PACE_OFFSETS[dnfNum]);
      } else {
        const allPaces = [...basePaces.values()];
        const midfield = median(allPaces);
        basePaces.set(dnfNum, midfield + DNF_PACE_OFFSETS[dnfNum]);
      }
    }
  }

  const raceData = {
    race: {
      name: "Monaco Grand Prix",
      year: 2024,
      totalLaps: 78,
      pitLossSec: 22,
    },
    drivers: Object.entries(DRIVER_GRID_ORDER)
      .sort(([, posA], [, posB]) => posA - posB)
      .map(([numStr, gridPos]) => {
        const num = parseInt(numStr);
        const apiDriver = uniqueDrivers.get(num);
        const strat = DEFAULT_STRATEGIES[num];
        const stints = [];
        let startLap = 1;
        for (const s of strat) {
          stints.push({
            startLap,
            endLap: s.endLap,
            compound: s.compound.toLowerCase(),
          });
          startLap = s.endLap + 1;
        }

        return {
          id: apiDriver?.name_acronym ?? `D${num}`,
          name: apiDriver?.broadcast_name ?? `Driver ${num}`,
          team: apiDriver?.team_name ?? "Unknown",
          teamColor: apiDriver?.team_colour
            ? `#${apiDriver.team_colour}`
            : "#FFFFFF",
          number: num,
          gridPosition: gridPos,
          basePaceSec: basePaces.get(num) ?? 78.0,
          defaultStrategy: stints,
        };
      }),
  };

  const outPath = new URL("../src/data/race-data.json", import.meta.url);
  const { writeFileSync, mkdirSync } = await import("fs");
  const { dirname } = await import("path");
  const { fileURLToPath } = await import("url");
  const filePath = fileURLToPath(outPath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(raceData, null, 2));

  console.log(`\nWrote ${raceData.drivers.length} drivers to ${filePath}`);
  console.log("Base paces:");
  for (const d of raceData.drivers) {
    console.log(`  ${d.id} (P${d.gridPosition}): ${d.basePaceSec}s`);
  }
}

main().catch(console.error);
