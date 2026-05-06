const SESSION_KEY = 11280;
const API_BASE = "https://api.openf1.org/v1";

type ApiLap = {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  is_pit_out_lap: boolean;
};

type ApiDriver = {
  driver_number: number;
  full_name: string;
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

const TOTAL_LAPS = 57;
const PIT_LOSS_SEC = 24;

const DRIVER_GRID_ORDER: Record<number, number> = {
  1: 1,   // NOR
  81: 2,  // PIA
  12: 3,  // ANT
  63: 4,  // RUS
  3: 5,   // VER
  44: 6,  // HAM
  16: 7,  // LEC
  55: 8,  // SAI
  43: 9,  // COL
  10: 10, // GAS
  87: 11, // BEA
  23: 12, // ALB
  6: 13,  // HAD
  31: 14, // OCO
  5: 15,  // BOR
  30: 16, // LAW
  41: 17, // LIN
  27: 18, // HUL
  14: 19, // ALO
  18: 20, // STR
  11: 21, // PER
  77: 22, // BOT
};

const DNF_DRIVERS = new Set([27, 30, 10, 6]);

const DEFAULT_STRATEGIES: Record<number, { compound: string; endLap: number }[]> = {
  12: [{ compound: "medium", endLap: 26 }, { compound: "hard", endLap: 57 }],
  1:  [{ compound: "medium", endLap: 27 }, { compound: "hard", endLap: 57 }],
  81: [{ compound: "medium", endLap: 28 }, { compound: "hard", endLap: 57 }],
  63: [{ compound: "medium", endLap: 20 }, { compound: "hard", endLap: 57 }],
  3:  [{ compound: "medium", endLap: 6 },  { compound: "hard", endLap: 57 }],
  16: [{ compound: "medium", endLap: 21 }, { compound: "hard", endLap: 57 }],
  44: [{ compound: "medium", endLap: 27 }, { compound: "hard", endLap: 57 }],
  43: [{ compound: "medium", endLap: 25 }, { compound: "hard", endLap: 57 }],
  55: [{ compound: "medium", endLap: 23 }, { compound: "hard", endLap: 57 }],
  23: [{ compound: "medium", endLap: 24 }, { compound: "hard", endLap: 57 }],
  87: [{ compound: "medium", endLap: 22 }, { compound: "hard", endLap: 57 }],
  5:  [{ compound: "medium", endLap: 22 }, { compound: "hard", endLap: 57 }],
  31: [{ compound: "medium", endLap: 24 }, { compound: "hard", endLap: 57 }],
  41: [{ compound: "medium", endLap: 23 }, { compound: "hard", endLap: 57 }],
  14: [{ compound: "medium", endLap: 41 }, { compound: "soft", endLap: 57 }],
  11: [{ compound: "medium", endLap: 22 }, { compound: "hard", endLap: 57 }],
  18: [{ compound: "medium", endLap: 21 }, { compound: "soft", endLap: 37 }, { compound: "soft", endLap: 57 }],
  77: [{ compound: "medium", endLap: 6 },  { compound: "soft", endLap: 21 }, { compound: "medium", endLap: 30 }, { compound: "medium", endLap: 57 }],
  27: [{ compound: "medium", endLap: 22 }, { compound: "hard", endLap: 57 }],
  30: [{ compound: "medium", endLap: 23 }, { compound: "hard", endLap: 57 }],
  10: [{ compound: "medium", endLap: 25 }, { compound: "hard", endLap: 57 }],
  6:  [{ compound: "medium", endLap: 24 }, { compound: "hard", endLap: 57 }],
};

const TEAMMATE_MAP: Record<number, number> = {
  27: 5,   // HUL → BOR
  30: 41,  // LAW → LIN
  10: 43,  // GAS → COL
  6: 3,    // HAD → VER
};

const DNF_PACE_OFFSETS: Record<number, number> = {
  27: 0.3,
  30: 0.2,
  10: 0.1,
  6: 0.8,
};

const ACTUAL_FINISH_ORDER = [
  12, 1, 81, 63, 3, 16, 44, 43, 55, 23,
  87, 5, 31, 41, 14, 11, 18, 77, 27, 30, 10, 6,
];

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

  const gridEntries = Object.entries(DRIVER_GRID_ORDER)
    .sort(([, posA], [, posB]) => posA - posB);

  const raceData = {
    race: {
      name: "Miami Grand Prix",
      year: 2026,
      totalLaps: TOTAL_LAPS,
      pitLossSec: PIT_LOSS_SEC,
    },
    drivers: gridEntries.map(([numStr, gridPos]) => {
      const num = parseInt(numStr);
      const apiDriver = uniqueDrivers.get(num);
      const strat = DEFAULT_STRATEGIES[num] ?? [{ compound: "medium", endLap: TOTAL_LAPS }];
      const driverStints = [];
      let startLap = 1;
      for (const s of strat) {
        driverStints.push({
          startLap,
          endLap: Math.min(s.endLap, TOTAL_LAPS),
          compound: s.compound.toLowerCase(),
        });
        startLap = s.endLap + 1;
      }

      const lastStint = driverStints[driverStints.length - 1];
      if (lastStint.endLap < TOTAL_LAPS) {
        if (driverStints.length === 1) {
          const firstCompound = lastStint.compound;
          const secondCompound = firstCompound === "hard" ? "medium" : "hard";
          const midLap = Math.round(TOTAL_LAPS * 0.4);
          lastStint.endLap = midLap;
          driverStints.push({
            startLap: midLap + 1,
            endLap: TOTAL_LAPS,
            compound: secondCompound,
          });
        } else {
          lastStint.endLap = TOTAL_LAPS;
        }
        console.log(`  Extended strategy for driver ${num} to cover full race`);
      }

      return {
        id: apiDriver?.name_acronym ?? `D${num}`,
        name: apiDriver?.full_name
          ? apiDriver.full_name
              .split(" ")
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(" ")
          : `Driver ${num}`,
        team: apiDriver?.team_name ?? "Unknown",
        teamColor: apiDriver?.team_colour
          ? `#${apiDriver.team_colour}`
          : "#FFFFFF",
        number: num,
        gridPosition: gridPos,
        basePaceSec: basePaces.get(num) ?? 93.0,
        defaultStrategy: driverStints,
      };
    }),
    actualOrder: ACTUAL_FINISH_ORDER.map(
      (num) => uniqueDrivers.get(num)?.name_acronym ?? `D${num}`
    ),
  };

  const outPath = new URL("../src/data/miami-2026.json", import.meta.url);
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
