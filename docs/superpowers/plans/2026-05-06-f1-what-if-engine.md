# F1 What-If Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a viral F1 strategy game where users change Verstappen's pit strategy at Monaco 2024 and see how the race result changes, then share it via OG image cards.

**Architecture:** Client-side simulation engine (pure TypeScript, runs in browser), precomputed race data from OpenF1 API (static JSON), single Next.js app with three game views and an OG image generation API route. All 20 drivers simulated dynamically lap-by-lap.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Vitest, next/og (Satori), Vercel deployment

**Design Spec:** `docs/superpowers/specs/2026-05-06-f1-what-if-engine-design.md`

---

## File Structure

```
f1-what-if-engine/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout: fonts, metadata, body styles
│   │   ├── page.tsx                  # Main game page: state machine for 3 views
│   │   ├── globals.css               # Tailwind directives + global resets
│   │   ├── share/
│   │   │   └── page.tsx              # Share landing page: result + "Can you beat this?" CTA
│   │   └── api/
│   │       └── og/
│   │           └── route.tsx         # OG image generation: F1 broadcast-style 1200×630 PNG
│   ├── engine/
│   │   ├── types.ts                  # All shared TypeScript types
│   │   ├── constants.ts              # Tire model, team colors, tier definitions
│   │   ├── validate.ts               # Strategy validation rules
│   │   └── simulate.ts              # Pure simulation function + scoring + key moment
│   ├── data/
│   │   ├── race-data.json            # Precomputed Monaco 2024 race data (static)
│   │   └── challenges.ts             # MVP challenge definition
│   └── components/
│       ├── ChallengeBrief.tsx        # Screen 1: challenge intro + "Accept" CTA
│       ├── StrategyBuilder.tsx       # Screen 2: pit stops, tire selectors, timeline
│       ├── TireBar.tsx               # Strategy timeline visualization bar
│       ├── ResultCard.tsx            # Screen 3: hero position change, strategy, key moment
│       ├── ScoreBadge.tsx            # Tier badge with label and color
│       └── StandingsComparison.tsx   # Actual vs simulation standings table
├── scripts/
│   └── fetch-race-data.ts           # OpenF1 API fetcher → generates race-data.json
├── __tests__/
│   ├── validate.test.ts              # Strategy validation tests
│   └── simulate.test.ts             # Simulation engine tests
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vitest.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd f1-what-if-engine
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```

When prompted, accept defaults. This creates the full Next.js scaffold with TypeScript, Tailwind, ESLint, App Router, and src/ directory.

- [ ] **Step 2: Install test dependencies**

```bash
npm install -D vitest
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

- [ ] **Step 4: Add test script to package.json**

Add to the `"scripts"` section:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Configure Tailwind with F1 design tokens**

Replace `tailwind.config.ts` with:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          bg: "#15151E",
          surface: "#1E1E2D",
          red: "#E10600",
          grey: "#97989B",
          gain: "#00FF87",
          loss: "#FF4444",
          gold: "#FFD700",
        },
        tire: {
          soft: "#DA291C",
          medium: "#FFD700",
          hard: "#FFFFFF",
        },
        team: {
          "red-bull": "#3671C6",
          ferrari: "#E8002D",
          mclaren: "#FF8000",
          mercedes: "#27F4D2",
          rb: "#6692FF",
          williams: "#64C4FF",
          alpine: "#0093CC",
          "aston-martin": "#229971",
          sauber: "#52E252",
          haas: "#B6BABD",
        },
      },
      fontFamily: {
        display: ["var(--font-orbitron)", "sans-serif"],
        body: ["var(--font-chakra)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 6: Set up globals.css**

Replace `src/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #15151e;
  color: #ffffff;
}
```

- [ ] **Step 7: Set up root layout with Google Fonts**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Orbitron, Chakra_Petch } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-chakra",
  display: "swap",
});

export const metadata: Metadata = {
  title: "F1 What-If Engine",
  description: "Change strategy, change the race outcome.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${chakraPetch.variable}`}>
      <body className="font-body antialiased min-h-screen">{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create placeholder page**

Replace `src/app/page.tsx` with:

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="font-display text-4xl font-black text-f1-red">
        F1 WHAT-IF ENGINE
      </h1>
    </main>
  );
}
```

- [ ] **Step 9: Initialize git and commit**

```bash
git init
echo ".superpowers/" >> .gitignore
git add .
git commit -m "feat: scaffold Next.js project with Tailwind F1 theme and fonts"
```

- [ ] **Step 10: Verify everything works**

Run: `npm run dev`

Expected: App starts on localhost:3000, shows "F1 WHAT-IF ENGINE" in Orbitron font on dark background.

Run: `npm run build`

Expected: Build succeeds with no errors.

---

### Task 2: Types & Constants

**Files:**
- Create: `src/engine/types.ts`, `src/engine/constants.ts`

- [ ] **Step 1: Create shared types**

Create `src/engine/types.ts`:

```typescript
export type Compound = "soft" | "medium" | "hard";

export type Stint = {
  startLap: number;
  endLap: number;
  compound: Compound;
};

export type DriverData = {
  id: string;
  name: string;
  team: string;
  teamColor: string;
  number: number;
  gridPosition: number;
  basePaceSec: number;
  defaultStrategy: Stint[];
};

export type RaceInfo = {
  name: string;
  year: number;
  totalLaps: number;
  pitLossSec: number;
};

export type RaceData = {
  race: RaceInfo;
  drivers: DriverData[];
};

export type UserStrategy = {
  pitLaps: number[];
  compounds: Compound[];
};

export type PositionChange = {
  lap: number;
  newPosition: number;
  oldPosition: number;
  overtakenDriverName: string;
  isPitLap: boolean;
};

export type SimOutput = {
  finalPosition: number;
  totalTimeSec: number;
  lapTimes: number[];
  positionsPerLap: number[];
  positionChanges: PositionChange[];
  allDriverResults: { driverId: string; finalPosition: number }[];
};

export type SimResult = {
  finalPosition: number;
  originalPosition: number;
  positionsGained: number;
  totalTimeSec: number;
  lapTimes: number[];
  positionsPerLap: number[];
  score: number;
  keyMoment: string;
  tier: string;
  allDriverResults: { driverId: string; finalPosition: number }[];
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  raceId: string;
  driverId: string;
  originalPosition: number;
  targetPosition: number;
  maxPitStops: number;
  allowedCompounds: Compound[];
  rules: {
    minPitStops: number;
    minCompounds: number;
    minLapsBetweenStops: number;
  };
};

export type ValidationError = {
  field: string;
  message: string;
};
```

- [ ] **Step 2: Create constants**

Create `src/engine/constants.ts`:

```typescript
import { Compound } from "./types";

export const TIRE_CONFIG: Record<
  Compound,
  {
    effect: number;
    degradationPerLap: number;
    lifetime: number;
    label: string;
  }
> = {
  soft: {
    effect: -1.2,
    degradationPerLap: 0.3,
    lifetime: 15,
    label: "Soft",
  },
  medium: {
    effect: -0.6,
    degradationPerLap: 0.15,
    lifetime: 25,
    label: "Medium",
  },
  hard: {
    effect: 0.3,
    degradationPerLap: 0.05,
    lifetime: 35,
    label: "Hard",
  },
};

export const OVER_LIFETIME_PENALTY = 2.0;

export const TRAFFIC_THRESHOLDS = [
  { maxGap: 1.5, penalty: 0.8 },
  { maxGap: 3.0, penalty: 0.3 },
];

export const TIER_LABELS: Record<string, { label: string; minPosition: number; maxPosition: number }> = {
  legendary: { label: "Strategy God", minPosition: 1, maxPosition: 1 },
  excellent: { label: "Podium Hero", minPosition: 2, maxPosition: 2 },
  target: { label: "Mission Complete", minPosition: 3, maxPosition: 3 },
  improved: { label: "Getting Closer", minPosition: 4, maxPosition: 5 },
  unchanged: { label: "Back to the Drawing Board", minPosition: 6, maxPosition: 6 },
  worse: { label: "That Wasn't the Plan", minPosition: 7, maxPosition: 20 },
};

export function getTierForPosition(position: number): string {
  for (const [, tier] of Object.entries(TIER_LABELS)) {
    if (position >= tier.minPosition && position <= tier.maxPosition) {
      return tier.label;
    }
  }
  return "That Wasn't the Plan";
}

export const TEAM_COLORS: Record<string, string> = {
  "Red Bull": "#3671C6",
  Ferrari: "#E8002D",
  McLaren: "#FF8000",
  Mercedes: "#27F4D2",
  RB: "#6692FF",
  Williams: "#64C4FF",
  Alpine: "#0093CC",
  "Aston Martin": "#229971",
  Sauber: "#52E252",
  Haas: "#B6BABD",
};

export const TIRE_COLORS: Record<Compound, string> = {
  soft: "#DA291C",
  medium: "#FFD700",
  hard: "#FFFFFF",
};

export const ACTUAL_RACE_ORDER: { id: string; name: string; team: string; teamColor: string }[] = [
  { id: "LEC", name: "Charles Leclerc", team: "Ferrari", teamColor: "#E8002D" },
  { id: "PIA", name: "Oscar Piastri", team: "McLaren", teamColor: "#FF8000" },
  { id: "SAI", name: "Carlos Sainz", team: "Ferrari", teamColor: "#E8002D" },
  { id: "NOR", name: "Lando Norris", team: "McLaren", teamColor: "#FF8000" },
  { id: "RUS", name: "George Russell", team: "Mercedes", teamColor: "#27F4D2" },
  { id: "VER", name: "Max Verstappen", team: "Red Bull", teamColor: "#3671C6" },
  { id: "HAM", name: "Lewis Hamilton", team: "Mercedes", teamColor: "#27F4D2" },
  { id: "TSU", name: "Yuki Tsunoda", team: "RB", teamColor: "#6692FF" },
  { id: "ALB", name: "Alexander Albon", team: "Williams", teamColor: "#64C4FF" },
  { id: "GAS", name: "Pierre Gasly", team: "Alpine", teamColor: "#0093CC" },
  { id: "ALO", name: "Fernando Alonso", team: "Aston Martin", teamColor: "#229971" },
  { id: "RIC", name: "Daniel Ricciardo", team: "RB", teamColor: "#6692FF" },
  { id: "BOT", name: "Valtteri Bottas", team: "Sauber", teamColor: "#52E252" },
  { id: "STR", name: "Lance Stroll", team: "Aston Martin", teamColor: "#229971" },
  { id: "SAR", name: "Logan Sargeant", team: "Williams", teamColor: "#64C4FF" },
  { id: "ZHO", name: "Zhou Guanyu", team: "Sauber", teamColor: "#52E252" },
  { id: "OCO", name: "Esteban Ocon", team: "Alpine", teamColor: "#0093CC" },
  { id: "PER", name: "Sergio Perez", team: "Red Bull", teamColor: "#3671C6" },
  { id: "HUL", name: "Nico Hulkenberg", team: "Haas", teamColor: "#B6BABD" },
  { id: "MAG", name: "Kevin Magnussen", team: "Haas", teamColor: "#B6BABD" },
];
```

- [ ] **Step 3: Commit**

```bash
git add src/engine/types.ts src/engine/constants.ts
git commit -m "feat: add shared types and F1 constants (tires, teams, tiers)"
```

---

### Task 3: OpenF1 Data Fetcher & Race Data

**Files:**
- Create: `scripts/fetch-race-data.ts`, `src/data/race-data.json`

- [ ] **Step 1: Create the data fetcher script**

Create `scripts/fetch-race-data.ts`:

```typescript
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
```

- [ ] **Step 2: Run the fetcher to generate race-data.json**

```bash
mkdir -p src/data
npx tsx scripts/fetch-race-data.ts
```

Expected: Creates `src/data/race-data.json` with 20 drivers, their base paces, and default strategies. Console output shows each driver's pace.

- [ ] **Step 3: Verify the generated data**

Open `src/data/race-data.json` and verify:
- 20 drivers present
- Grid positions 1-20
- Base paces are reasonable (roughly 76-79 seconds)
- Each driver has a default strategy with 2 stints
- Verstappen (VER) is grid position 6

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch-race-data.ts src/data/race-data.json
git commit -m "feat: add OpenF1 data fetcher and precomputed Monaco 2024 race data"
```

---

### Task 4: Challenge Definition

**Files:**
- Create: `src/data/challenges.ts`

- [ ] **Step 1: Create the MVP challenge**

Create `src/data/challenges.ts`:

```typescript
import { Challenge } from "@/engine/types";

export const MONACO_2024_CHALLENGE: Challenge = {
  id: "monaco-2024-ver",
  title: "Rescue the Champion",
  description:
    "Verstappen finished P6 at Monaco 2024. Can you get him to the podium?",
  raceId: "monaco-2024",
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
```

- [ ] **Step 2: Commit**

```bash
git add src/data/challenges.ts
git commit -m "feat: add Monaco 2024 Verstappen challenge definition"
```

---

### Task 5: Strategy Validation (TDD)

**Files:**
- Create: `src/engine/validate.ts`, `__tests__/validate.test.ts`

- [ ] **Step 1: Write validation tests**

Create `__tests__/validate.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/validate.test.ts`

Expected: All tests fail with "cannot find module" or similar.

- [ ] **Step 3: Implement validate.ts**

Create `src/engine/validate.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/validate.test.ts`

Expected: All 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/validate.ts __tests__/validate.test.ts
git commit -m "feat: add strategy validation with TDD (11 test cases)"
```

---

### Task 6: Simulation Engine (TDD)

**Files:**
- Create: `src/engine/simulate.ts`, `__tests__/simulate.test.ts`

- [ ] **Step 1: Write simulation tests**

Create `__tests__/simulate.test.ts`:

```typescript
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
  it("returns basePace + tire effect on lap 1 of stint (no degradation)", () => {
    const time = calculateLapTime(80, "soft", 1, 0, false, 22);
    expect(time).toBeCloseTo(80 - 1.2, 5);
  });

  it("accumulates degradation over laps", () => {
    const lap1 = calculateLapTime(80, "soft", 1, 0, false, 22);
    const lap10 = calculateLapTime(80, "soft", 10, 0, false, 22);
    expect(lap10 - lap1).toBeCloseTo(0.3 * 9, 5);
  });

  it("adds over-lifetime penalty for soft after 15 laps", () => {
    const lap15 = calculateLapTime(80, "soft", 15, 0, false, 22);
    const lap16 = calculateLapTime(80, "soft", 16, 0, false, 22);
    expect(lap16 - lap15).toBeCloseTo(0.3 + 2.0, 5);
  });

  it("adds traffic penalty for close gap", () => {
    const noTraffic = calculateLapTime(80, "medium", 1, 0, false, 22);
    const closeTraffic = calculateLapTime(80, "medium", 1, 1.0, false, 22);
    expect(closeTraffic - noTraffic).toBeCloseTo(0.8, 5);
  });

  it("adds smaller penalty for medium gap", () => {
    const noTraffic = calculateLapTime(80, "medium", 1, 0, false, 22);
    const medTraffic = calculateLapTime(80, "medium", 1, 2.0, false, 22);
    expect(medTraffic - noTraffic).toBeCloseTo(0.3, 5);
  });

  it("adds no penalty for large gap", () => {
    const noTraffic = calculateLapTime(80, "medium", 1, 0, false, 22);
    const farTraffic = calculateLapTime(80, "medium", 1, 5.0, false, 22);
    expect(farTraffic).toBeCloseTo(noTraffic, 5);
  });

  it("adds pit loss on pit laps", () => {
    const normal = calculateLapTime(80, "medium", 1, 0, false, 22);
    const pitLap = calculateLapTime(80, "medium", 1, 0, true, 22);
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

  it("produces a keyMoment string", () => {
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
    expect(result.keyMoment).toBeDefined();
    expect(result.keyMoment.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/simulate.test.ts`

Expected: All tests fail.

- [ ] **Step 3: Implement simulate.ts**

Create `src/engine/simulate.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/simulate.test.ts`

Expected: All tests pass (userStrategyToStints: 2, calculateLapTime: 7, simulateRace: 5, computeResult: 3 = 17 total).

- [ ] **Step 5: Commit**

```bash
git add src/engine/simulate.ts __tests__/simulate.test.ts
git commit -m "feat: add simulation engine with TDD (17 test cases)"
```

---

### Task 7: Root Layout & Global Styles

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`

- [ ] **Step 1: Finalize globals.css**

Replace `src/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-f1-bg text-white;
  }

  * {
    @apply box-border;
  }
}

@layer components {
  .f1-label {
    @apply font-body font-semibold uppercase tracking-[3px] text-f1-grey text-[10px];
  }

  .f1-heading {
    @apply font-body font-bold uppercase tracking-wide text-white;
  }

  .f1-number {
    @apply font-display font-black;
  }

  .f1-button {
    @apply bg-f1-red text-white font-body font-bold uppercase tracking-wider
           px-8 py-4 rounded-lg text-sm transition-opacity hover:opacity-90
           active:opacity-80;
  }

  .f1-button-outline {
    @apply border border-f1-grey/40 text-white font-body font-bold uppercase
           tracking-wider px-8 py-4 rounded-lg text-sm transition-opacity
           hover:opacity-90 active:opacity-80;
  }

  .f1-card {
    @apply bg-f1-surface rounded-lg p-4;
  }
}
```

- [ ] **Step 2: Update layout with viewport meta**

Update `src/app/layout.tsx` metadata:

```tsx
export const metadata: Metadata = {
  title: "F1 What-If Engine",
  description: "Change strategy, change the race outcome.",
  metadataBase: new URL("https://f1whatif.vercel.app"),
  openGraph: {
    title: "F1 What-If Engine",
    description: "Change strategy, change the race outcome.",
    type: "website",
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add F1 global styles and utility classes"
```

---

### Task 8: Challenge Brief Screen

**Files:**
- Create: `src/components/ChallengeBrief.tsx`

- [ ] **Step 1: Build the Challenge Brief component**

Create `src/components/ChallengeBrief.tsx`:

```tsx
"use client";

import { Challenge, RaceData } from "@/engine/types";

type Props = {
  challenge: Challenge;
  raceData: RaceData;
  onAccept: () => void;
};

export default function ChallengeBrief({
  challenge,
  raceData,
  onAccept,
}: Props) {
  const driver = raceData.drivers.find((d) => d.id === challenge.driverId);
  if (!driver) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="max-w-md w-full text-center">
        <p className="f1-label text-f1-red mb-4">
          {raceData.race.name} {raceData.race.year}
        </p>

        <h1 className="f1-heading text-3xl mb-2">{challenge.title}</h1>

        <div className="my-8">
          <div className="f1-card inline-block px-8 py-6">
            <div
              className="text-sm font-body font-bold uppercase tracking-wider mb-1"
              style={{ color: driver.teamColor }}
            >
              {driver.team}
            </div>
            <div className="f1-heading text-2xl">{driver.name}</div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div>
                <div className="f1-label mb-1">Grid</div>
                <div className="f1-number text-4xl text-f1-grey">
                  P{challenge.originalPosition}
                </div>
              </div>
              <div className="text-f1-red text-2xl">→</div>
              <div>
                <div className="f1-label mb-1">Target</div>
                <div className="f1-number text-4xl text-f1-gain">
                  P{challenge.targetPosition}
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-f1-grey font-body text-base mb-8 max-w-sm mx-auto">
          {challenge.description}
        </p>

        <div className="space-y-3 text-sm text-f1-grey font-body mb-10">
          <p>
            Max {challenge.maxPitStops} pit stops ·{" "}
            {raceData.race.totalLaps} laps · Must use 2+ compounds
          </p>
        </div>

        <button onClick={onAccept} className="f1-button w-full max-w-xs">
          Accept Challenge
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChallengeBrief.tsx
git commit -m "feat: add Challenge Brief screen component"
```

---

### Task 9: Strategy Builder & TireBar Components

**Files:**
- Create: `src/components/TireBar.tsx`, `src/components/StrategyBuilder.tsx`

- [ ] **Step 1: Build the TireBar component**

Create `src/components/TireBar.tsx`:

```tsx
"use client";

import { Compound } from "@/engine/types";
import { TIRE_COLORS } from "@/engine/constants";

type TireBarStint = {
  compound: Compound;
  startLap: number;
  endLap: number;
};

type Props = {
  stints: TireBarStint[];
  totalLaps: number;
};

export default function TireBar({ stints, totalLaps }: Props) {
  return (
    <div>
      <div className="flex h-10 rounded-md overflow-hidden">
        {stints.map((stint, i) => {
          const width =
            ((stint.endLap - stint.startLap + 1) / totalLaps) * 100;
          return (
            <div
              key={i}
              className="flex items-center justify-center text-xs font-body font-bold"
              style={{
                width: `${width}%`,
                backgroundColor: TIRE_COLORS[stint.compound],
                color: stint.compound === "hard" ? "#000" : "#fff",
                borderRight:
                  i < stints.length - 1 ? "2px solid #15151E" : "none",
              }}
            >
              {stint.compound[0].toUpperCase()} (L{stint.startLap}-
              {stint.endLap})
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-f1-grey">Lap 1</span>
        <span className="text-[10px] text-f1-grey">Lap {totalLaps}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build the StrategyBuilder component**

Create `src/components/StrategyBuilder.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import {
  Challenge,
  Compound,
  RaceData,
  UserStrategy,
  ValidationError,
} from "@/engine/types";
import { TIRE_CONFIG, TIRE_COLORS } from "@/engine/constants";
import { validateStrategy } from "@/engine/validate";
import TireBar from "./TireBar";

type Props = {
  challenge: Challenge;
  raceData: RaceData;
  onSimulate: (strategy: UserStrategy) => void;
};

const COMPOUNDS: Compound[] = ["soft", "medium", "hard"];

export default function StrategyBuilder({
  challenge,
  raceData,
  onSimulate,
}: Props) {
  const { totalLaps } = raceData.race;
  const [startCompound, setStartCompound] = useState<Compound>("soft");
  const [pit1Lap, setPit1Lap] = useState(20);
  const [pit1Compound, setPit1Compound] = useState<Compound>("hard");
  const [hasPit2, setHasPit2] = useState(false);
  const [pit2Lap, setPit2Lap] = useState(50);
  const [pit2Compound, setPit2Compound] = useState<Compound>("medium");

  const strategy = useMemo<UserStrategy>(() => {
    if (hasPit2) {
      return {
        pitLaps: [pit1Lap, pit2Lap],
        compounds: [startCompound, pit1Compound, pit2Compound],
      };
    }
    return {
      pitLaps: [pit1Lap],
      compounds: [startCompound, pit1Compound],
    };
  }, [startCompound, pit1Lap, pit1Compound, hasPit2, pit2Lap, pit2Compound]);

  const errors = useMemo(
    () => validateStrategy(strategy, challenge, totalLaps),
    [strategy, challenge, totalLaps]
  );

  const stints = useMemo(() => {
    const result = [];
    let start = 1;
    for (let i = 0; i < strategy.compounds.length; i++) {
      const end =
        i < strategy.pitLaps.length ? strategy.pitLaps[i] : totalLaps;
      result.push({
        startLap: start,
        endLap: end,
        compound: strategy.compounds[i],
      });
      start = end + 1;
    }
    return result;
  }, [strategy, totalLaps]);

  const driver = raceData.drivers.find((d) => d.id === challenge.driverId);

  function clampLap(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="f1-label text-f1-red mb-1">
              {challenge.title}
            </p>
            <p className="f1-heading text-lg">
              {driver?.name} — P{challenge.originalPosition} → P
              {challenge.targetPosition}
            </p>
          </div>
          <p className="text-f1-grey text-sm font-body">
            {totalLaps} laps
          </p>
        </div>

        <div className="mb-6">
          <p className="f1-label mb-3">Race Timeline</p>
          <TireBar stints={stints} totalLaps={totalLaps} />
        </div>

        <div className="f1-card mb-4">
          <p className="f1-label mb-3">Starting Tire</p>
          <div className="flex gap-2">
            {COMPOUNDS.map((c) => (
              <button
                key={c}
                onClick={() => setStartCompound(c)}
                className={`flex-1 py-2 rounded-md font-body font-bold text-sm uppercase transition-opacity ${
                  startCompound === c
                    ? "ring-2 ring-white"
                    : "opacity-40"
                }`}
                style={{
                  backgroundColor: TIRE_COLORS[c],
                  color: c === "hard" ? "#000" : "#fff",
                }}
              >
                {TIRE_CONFIG[c].label}
              </button>
            ))}
          </div>
        </div>

        <div className="f1-card mb-4">
          <p className="f1-label mb-3">Pit Stop 1</p>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm text-f1-grey font-body">Lap:</span>
            <button
              onClick={() => setPit1Lap((l) => clampLap(l - 1, 2, totalLaps - 5))}
              className="w-8 h-8 rounded bg-f1-bg text-white font-body font-bold"
            >
              −
            </button>
            <span className="f1-number text-xl w-10 text-center">
              {pit1Lap}
            </span>
            <button
              onClick={() => setPit1Lap((l) => clampLap(l + 1, 2, totalLaps - 5))}
              className="w-8 h-8 rounded bg-f1-bg text-white font-body font-bold"
            >
              +
            </button>
          </div>
          <p className="f1-label mb-2">Next Tire</p>
          <div className="flex gap-2">
            {COMPOUNDS.map((c) => (
              <button
                key={c}
                onClick={() => setPit1Compound(c)}
                className={`flex-1 py-2 rounded-md font-body font-bold text-sm uppercase transition-opacity ${
                  pit1Compound === c
                    ? "ring-2 ring-white"
                    : "opacity-40"
                }`}
                style={{
                  backgroundColor: TIRE_COLORS[c],
                  color: c === "hard" ? "#000" : "#fff",
                }}
              >
                {TIRE_CONFIG[c].label}
              </button>
            ))}
          </div>
        </div>

        {challenge.maxPitStops >= 2 && (
          <div className="f1-card mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="f1-label">Pit Stop 2</p>
              <button
                onClick={() => setHasPit2(!hasPit2)}
                className={`text-xs font-body font-bold uppercase tracking-wider px-3 py-1 rounded ${
                  hasPit2
                    ? "bg-f1-red text-white"
                    : "bg-f1-bg text-f1-grey"
                }`}
              >
                {hasPit2 ? "Enabled" : "Add Stop"}
              </button>
            </div>
            {hasPit2 && (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-sm text-f1-grey font-body">
                    Lap:
                  </span>
                  <button
                    onClick={() =>
                      setPit2Lap((l) => clampLap(l - 1, pit1Lap + 5, totalLaps - 5))
                    }
                    className="w-8 h-8 rounded bg-f1-bg text-white font-body font-bold"
                  >
                    −
                  </button>
                  <span className="f1-number text-xl w-10 text-center">
                    {pit2Lap}
                  </span>
                  <button
                    onClick={() =>
                      setPit2Lap((l) => clampLap(l + 1, pit1Lap + 5, totalLaps - 5))
                    }
                    className="w-8 h-8 rounded bg-f1-bg text-white font-body font-bold"
                  >
                    +
                  </button>
                </div>
                <p className="f1-label mb-2">Next Tire</p>
                <div className="flex gap-2">
                  {COMPOUNDS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setPit2Compound(c)}
                      className={`flex-1 py-2 rounded-md font-body font-bold text-sm uppercase transition-opacity ${
                        pit2Compound === c
                          ? "ring-2 ring-white"
                          : "opacity-40"
                      }`}
                      style={{
                        backgroundColor: TIRE_COLORS[c],
                        color: c === "hard" ? "#000" : "#fff",
                      }}
                    >
                      {TIRE_CONFIG[c].label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-f1-loss/10 border border-f1-loss/30">
            {errors.map((e, i) => (
              <p key={i} className="text-f1-loss text-sm font-body">
                {e.message}
              </p>
            ))}
          </div>
        )}

        <button
          onClick={() => errors.length === 0 && onSimulate(strategy)}
          disabled={errors.length > 0}
          className={`f1-button w-full ${
            errors.length > 0 ? "opacity-40 cursor-not-allowed" : ""
          }`}
        >
          Simulate Race →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TireBar.tsx src/components/StrategyBuilder.tsx
git commit -m "feat: add Strategy Builder and TireBar components"
```

---

### Task 10: Result Screen Components

**Files:**
- Create: `src/components/ScoreBadge.tsx`, `src/components/StandingsComparison.tsx`, `src/components/ResultCard.tsx`

- [ ] **Step 1: Build ScoreBadge component**

Create `src/components/ScoreBadge.tsx`:

```tsx
type Props = {
  tier: string;
};

export default function ScoreBadge({ tier }: Props) {
  return (
    <div className="text-f1-gold text-xs font-body font-semibold uppercase tracking-[3px]">
      ★ {tier} ★
    </div>
  );
}
```

- [ ] **Step 2: Build StandingsComparison component**

Create `src/components/StandingsComparison.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ACTUAL_RACE_ORDER } from "@/engine/constants";
import { RaceData } from "@/engine/types";

type Props = {
  allDriverResults: { driverId: string; finalPosition: number }[];
  challengeDriverId: string;
  raceData: RaceData;
};

export default function StandingsComparison({
  allDriverResults,
  challengeDriverId,
  raceData,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const displayCount = expanded ? 20 : 10;

  const simOrder = [...allDriverResults].sort(
    (a, b) => a.finalPosition - b.finalPosition
  );

  const actualMap = new Map(
    ACTUAL_RACE_ORDER.map((d, i) => [d.id, i + 1])
  );
  const simMap = new Map(
    simOrder.map((d) => [d.driverId, d.finalPosition])
  );

  const rows = Array.from({ length: displayCount }, (_, i) => {
    const pos = i + 1;

    const actualDriver = ACTUAL_RACE_ORDER[i];

    const simEntry = simOrder.find((d) => d.finalPosition === pos);
    const simDriverId = simEntry?.driverId ?? "";
    const simDriverData = raceData.drivers.find((d) => d.id === simDriverId);

    const actualPosOfSimDriver = actualMap.get(simDriverId) ?? 0;
    const delta = actualPosOfSimDriver - pos;

    return {
      pos,
      actualId: actualDriver?.id ?? "",
      actualName: actualDriver?.name ?? "",
      actualTeamColor: actualDriver?.teamColor ?? "#fff",
      simId: simDriverId,
      simName: simDriverData?.name ?? "",
      simTeamColor: simDriverData?.teamColor ?? "#fff",
      delta,
    };
  });

  return (
    <div className="f1-card text-left mb-4">
      <p className="f1-label mb-3">Actual vs Your Simulation</p>

      <div className="overflow-hidden rounded-md">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="text-f1-grey text-[10px] uppercase tracking-wider">
              <th className="text-left py-2 px-2 w-8">P</th>
              <th className="text-left py-2 px-2">Actual Race</th>
              <th className="text-left py-2 px-2">Your Simulation</th>
              <th className="text-right py-2 px-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isChallenge = row.simId === challengeDriverId;
              return (
                <tr
                  key={row.pos}
                  className={`border-t border-white/5 ${
                    isChallenge ? "bg-team-red-bull/10" : ""
                  }`}
                >
                  <td className="py-2 px-2 f1-number text-f1-grey text-xs">
                    {row.pos}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className="inline-block w-1 h-4 rounded-sm mr-2 align-middle"
                      style={{ backgroundColor: row.actualTeamColor }}
                    />
                    <span
                      className={`text-xs align-middle ${
                        row.actualId === challengeDriverId
                          ? "text-white font-bold"
                          : "text-f1-grey"
                      }`}
                    >
                      {row.actualName}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className="inline-block w-1 h-4 rounded-sm mr-2 align-middle"
                      style={{ backgroundColor: row.simTeamColor }}
                    />
                    <span
                      className={`text-xs align-middle ${
                        isChallenge ? "text-white font-bold" : "text-f1-grey"
                      }`}
                    >
                      {row.simName}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    {row.delta !== 0 && (
                      <span
                        className={`text-[10px] font-bold ${
                          row.delta > 0 ? "text-f1-gain" : "text-f1-loss"
                        }`}
                      >
                        {row.delta > 0 ? `↑${row.delta}` : `↓${Math.abs(row.delta)}`}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full mt-3 py-2 text-center text-f1-grey text-xs font-body font-bold uppercase tracking-wider hover:text-white transition-colors"
        >
          Full Classification ↓
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Build ResultCard component**

Create `src/components/ResultCard.tsx`:

```tsx
"use client";

import { SimResult, UserStrategy, RaceData, Challenge } from "@/engine/types";
import { TIRE_COLORS } from "@/engine/constants";
import { userStrategyToStints } from "@/engine/simulate";
import TireBar from "./TireBar";
import ScoreBadge from "./ScoreBadge";
import StandingsComparison from "./StandingsComparison";

type Props = {
  result: SimResult;
  strategy: UserStrategy;
  raceData: RaceData;
  challenge: Challenge;
  onRetry: () => void;
  onShare: () => void;
};

export default function ResultCard({
  result,
  strategy,
  raceData,
  challenge,
  onRetry,
  onShare,
}: Props) {
  const driver = raceData.drivers.find((d) => d.id === challenge.driverId);
  if (!driver) return null;

  const stints = userStrategyToStints(strategy, raceData.race.totalLaps);

  const gainColor =
    result.positionsGained > 0
      ? "text-f1-gain"
      : result.positionsGained < 0
        ? "text-f1-loss"
        : "text-f1-grey";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="max-w-md w-full text-center">
        <ScoreBadge tier={result.tier} />

        <div className="flex items-center justify-center gap-6 my-8">
          <div>
            <p className="f1-label mb-1">Was</p>
            <p className="f1-number text-5xl text-f1-grey">
              P{result.originalPosition}
            </p>
          </div>
          <div className={`text-3xl ${gainColor}`}>→</div>
          <div>
            <p className="f1-label mb-1">Now</p>
            <p className={`f1-number text-5xl ${gainColor}`}>
              P{result.finalPosition}
            </p>
          </div>
        </div>

        {result.positionsGained !== 0 && (
          <p className={`font-body font-bold text-sm ${gainColor} mb-6`}>
            {result.positionsGained > 0 ? "+" : ""}
            {result.positionsGained} position
            {Math.abs(result.positionsGained) !== 1 ? "s" : ""}
            {result.positionsGained > 0 ? " gained" : " lost"}
          </p>
        )}

        <div className="mb-2">
          <p className="f1-heading text-lg">{driver.name}</p>
          <p className="text-f1-grey text-sm font-body">
            {raceData.race.name} {raceData.race.year}
          </p>
        </div>

        <div className="f1-card mb-4 text-left">
          <p className="f1-label mb-2">Your Strategy</p>
          <TireBar stints={stints} totalLaps={raceData.race.totalLaps} />
          <p className="text-f1-grey text-xs font-body mt-2">
            {stints
              .map(
                (s) =>
                  `${s.compound[0].toUpperCase()}${s.compound.slice(1)} (L${s.startLap}-${s.endLap})`
              )
              .join(" → ")}
          </p>
        </div>

        <div className="f1-card mb-4 text-left border-l-[3px] border-f1-red">
          <p className="f1-label text-f1-red mb-1">Key Moment</p>
          <p className="text-white text-sm font-body">{result.keyMoment}</p>
        </div>

        <div className="mb-6">
          <p className="f1-label mb-1">Score</p>
          <p className="f1-number text-4xl">{result.score}</p>
        </div>

        <StandingsComparison
          allDriverResults={result.allDriverResults}
          challengeDriverId={challenge.driverId}
          raceData={raceData}
        />

        <div className="flex gap-3 max-w-xs mx-auto">
          <button onClick={onShare} className="f1-button flex-1">
            Share Result
          </button>
          <button onClick={onRetry} className="f1-button-outline flex-1">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ScoreBadge.tsx src/components/StandingsComparison.tsx src/components/ResultCard.tsx
git commit -m "feat: add Result screen components (ResultCard, StandingsComparison, ScoreBadge)"
```

---

### Task 11: Main Game Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Wire up the game state machine**

Replace `src/app/page.tsx` with:

```tsx
"use client";

import { useState, useMemo } from "react";
import raceDataJson from "@/data/race-data.json";
import { MONACO_2024_CHALLENGE } from "@/data/challenges";
import { RaceData, UserStrategy, SimResult } from "@/engine/types";
import { simulateRace, computeResult } from "@/engine/simulate";
import ChallengeBrief from "@/components/ChallengeBrief";
import StrategyBuilder from "@/components/StrategyBuilder";
import ResultCard from "@/components/ResultCard";

const raceData = raceDataJson as RaceData;
const challenge = MONACO_2024_CHALLENGE;

type GameView = "brief" | "strategy" | "result";

export default function Home() {
  const [view, setView] = useState<GameView>("brief");
  const [userStrategy, setUserStrategy] = useState<UserStrategy | null>(null);
  const [simResult, setSimResult] = useState<SimResult | null>(null);

  const baselineOutput = useMemo(() => {
    const driver = raceData.drivers.find((d) => d.id === challenge.driverId);
    if (!driver) return null;
    const defaultStrategy: UserStrategy = {
      pitLaps: driver.defaultStrategy.slice(0, -1).map((s) => s.endLap),
      compounds: driver.defaultStrategy.map((s) => s.compound),
    };
    return simulateRace(raceData, challenge.driverId, defaultStrategy);
  }, []);

  function handleAccept() {
    setView("strategy");
  }

  function handleSimulate(strategy: UserStrategy) {
    const output = simulateRace(raceData, challenge.driverId, strategy);
    if (!baselineOutput) return;
    const result = computeResult(
      output,
      baselineOutput,
      challenge.originalPosition,
      strategy
    );
    setUserStrategy(strategy);
    setSimResult(result);
    setView("result");
  }

  function handleRetry() {
    setSimResult(null);
    setUserStrategy(null);
    setView("strategy");
  }

  function handleShare() {
    if (!simResult || !userStrategy) return;

    const stintSummary = userStrategy.compounds
      .map((c, i) => {
        const endLap =
          i < userStrategy.pitLaps.length
            ? userStrategy.pitLaps[i]
            : raceData.race.totalLaps;
        return `${c[0].toUpperCase()}${endLap}`;
      })
      .join("-");

    const params = new URLSearchParams({
      d: challenge.driverId,
      f: String(challenge.originalPosition),
      t: String(simResult.finalPosition),
      s: String(simResult.score),
      st: stintSummary,
      tier: simResult.tier,
    });

    const shareUrl = `${window.location.origin}/share?${params}`;

    if (navigator.share) {
      navigator.share({
        title: `I got ${raceData.drivers.find((d) => d.id === challenge.driverId)?.name} from P${challenge.originalPosition} to P${simResult.finalPosition}!`,
        text: `Can you beat my strategy? F1 What-If Engine`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  }

  switch (view) {
    case "brief":
      return (
        <ChallengeBrief
          challenge={challenge}
          raceData={raceData}
          onAccept={handleAccept}
        />
      );
    case "strategy":
      return (
        <StrategyBuilder
          challenge={challenge}
          raceData={raceData}
          onSimulate={handleSimulate}
        />
      );
    case "result":
      return simResult && userStrategy ? (
        <ResultCard
          result={simResult}
          strategy={userStrategy}
          raceData={raceData}
          challenge={challenge}
          onRetry={handleRetry}
          onShare={handleShare}
        />
      ) : null;
  }
}
```

- [ ] **Step 2: Verify dev server runs**

Run: `npm run dev`

Expected: App loads on localhost:3000. Challenge Brief screen shows "Rescue the Champion" with Verstappen's info. Clicking "Accept Challenge" transitions to Strategy Builder. Adjusting strategy and clicking "Simulate Race" shows results.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire up main game page with 3-view state machine"
```

---

### Task 12: Share Page & OG Image Route

**Files:**
- Create: `src/app/share/page.tsx`, `src/app/api/og/route.tsx`

- [ ] **Step 1: Build the Share landing page**

Create `src/app/share/page.tsx`:

```tsx
import { Metadata } from "next";
import ShareContent from "./ShareContent";

type Props = {
  searchParams: Promise<{
    d?: string;
    f?: string;
    t?: string;
    s?: string;
    st?: string;
    tier?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const from = params.f ?? "?";
  const to = params.t ?? "?";

  const ogParams = new URLSearchParams();
  if (params.d) ogParams.set("d", params.d);
  if (params.f) ogParams.set("f", params.f);
  if (params.t) ogParams.set("t", params.t);
  if (params.s) ogParams.set("s", params.s);
  if (params.tier) ogParams.set("tier", params.tier);
  if (params.st) ogParams.set("st", params.st);

  return {
    title: `I got Verstappen from P${from} to P${to}! | F1 What-If Engine`,
    description: "Can you beat my strategy? Change pit stops, change the race.",
    openGraph: {
      title: `I got Verstappen from P${from} to P${to}!`,
      description: "Can you beat my strategy? F1 What-If Engine",
      images: [`/api/og?${ogParams.toString()}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `I got Verstappen from P${from} to P${to}!`,
      description: "Can you beat my strategy? F1 What-If Engine",
      images: [`/api/og?${ogParams.toString()}`],
    },
  };
}

export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams;
  return <ShareContent params={params} />;
}
```

- [ ] **Step 2: Create ShareContent client component**

This component re-runs the simulation client-side from the URL strategy params. Since the simulation is deterministic, it produces the exact same `allDriverResults` as the original player saw.

Create `src/app/share/ShareContent.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import raceDataJson from "@/data/race-data.json";
import { MONACO_2024_CHALLENGE } from "@/data/challenges";
import { RaceData, Compound, UserStrategy } from "@/engine/types";
import { simulateRace } from "@/engine/simulate";
import ScoreBadge from "@/components/ScoreBadge";
import StandingsComparison from "@/components/StandingsComparison";

const raceData = raceDataJson as RaceData;
const challenge = MONACO_2024_CHALLENGE;

type Props = {
  params: {
    d?: string;
    f?: string;
    t?: string;
    s?: string;
    st?: string;
    tier?: string;
  };
};

function parseStrategy(st: string, totalLaps: number): UserStrategy | null {
  const parts = st.split("-");
  if (parts.length < 2) return null;

  const compoundMap: Record<string, Compound> = {
    S: "soft",
    M: "medium",
    H: "hard",
  };

  const compounds: Compound[] = [];
  const pitLaps: number[] = [];

  for (let i = 0; i < parts.length; i++) {
    const letter = parts[i][0];
    const lap = parseInt(parts[i].slice(1));
    const compound = compoundMap[letter];
    if (!compound || isNaN(lap)) return null;
    compounds.push(compound);
    if (i < parts.length - 1) {
      pitLaps.push(lap);
    }
  }

  return { pitLaps, compounds };
}

export default function ShareContent({ params }: Props) {
  const from = params.f ?? "?";
  const to = params.t ?? "?";
  const score = params.s ?? "0";
  const tier = params.tier ?? "Unknown";
  const positionsGained = Number(from) - Number(to);

  const simOutput = useMemo(() => {
    if (!params.st) return null;
    const strategy = parseStrategy(params.st, raceData.race.totalLaps);
    if (!strategy) return null;
    return simulateRace(raceData, challenge.driverId, strategy);
  }, [params.st]);

  const gainColor =
    positionsGained > 0
      ? "text-f1-gain"
      : positionsGained < 0
        ? "text-f1-loss"
        : "text-f1-grey";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="max-w-md w-full text-center">
        <p className="f1-label text-f1-red mb-4">F1 What-If Engine</p>

        <ScoreBadge tier={tier} />

        <div className="flex items-center justify-center gap-6 my-8">
          <div>
            <p className="f1-label mb-1">Was</p>
            <p className="f1-number text-5xl text-f1-grey">P{from}</p>
          </div>
          <div className={`text-3xl ${gainColor}`}>→</div>
          <div>
            <p className="f1-label mb-1">Now</p>
            <p className={`f1-number text-5xl ${gainColor}`}>P{to}</p>
          </div>
        </div>

        <p className="f1-heading text-lg mb-2">Max Verstappen</p>
        <p className="text-f1-grey text-sm font-body mb-4">
          Monaco Grand Prix 2024
        </p>

        <div className="mb-6">
          <p className="f1-label mb-1">Score</p>
          <p className="f1-number text-4xl">{score}</p>
        </div>

        {simOutput && (
          <StandingsComparison
            allDriverResults={simOutput.allDriverResults}
            challengeDriverId={challenge.driverId}
            raceData={raceData}
          />
        )}

        <Link href="/" className="f1-button inline-block mt-4">
          Can you beat this? →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build the OG image route**

Create `src/app/api/og/route.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get("f") ?? "6";
  const to = searchParams.get("t") ?? "6";
  const score = searchParams.get("s") ?? "0";
  const tier = searchParams.get("tier") ?? "";
  const stStrategy = searchParams.get("st") ?? "";

  const [orbitronData, chakraData] = await Promise.all([
    fetch(
      new URL(
        "https://fonts.gstatic.com/s/orbitron/v31/yMJRMIlzdpvBhQQL_Qq7dy0.ttf"
      )
    ).then((res) => res.arrayBuffer()),
    fetch(
      new URL(
        "https://fonts.gstatic.com/s/chakrapetch/v11/cIflMapbsEk7TDLdtEz1BwkWmpLJQgs.ttf"
      )
    ).then((res) => res.arrayBuffer()),
  ]);

  const positionsGained = Number(from) - Number(to);
  const gainColor = positionsGained > 0 ? "#00FF87" : positionsGained < 0 ? "#FF4444" : "#97989B";

  const stintParts = stStrategy.split("-").map((part) => {
    const compound = part[0];
    const endLap = part.slice(1);
    const colors: Record<string, string> = {
      S: "#DA291C",
      M: "#FFD700",
      H: "#FFFFFF",
    };
    const labels: Record<string, string> = { S: "Soft", M: "Medium", H: "Hard" };
    return {
      color: colors[compound] ?? "#FFFFFF",
      label: labels[compound] ?? compound,
      endLap,
    };
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(180deg, #0a0a1a 0%, #0d1117 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "32px 40px",
          fontFamily: "Chakra Petch",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "#E10600",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                color: "#E10600",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "3px",
                textTransform: "uppercase" as const,
              }}
            >
              F1 WHAT-IF ENGINE
            </span>
            <span style={{ color: "#333", fontSize: "14px" }}>|</span>
            <span
              style={{
                color: "#97989B",
                fontSize: "13px",
                letterSpacing: "2px",
                textTransform: "uppercase" as const,
              }}
            >
              RACE SIMULATION
            </span>
          </div>
          <span
            style={{
              color: "#97989B",
              fontSize: "13px",
              letterSpacing: "2px",
              textTransform: "uppercase" as const,
            }}
          >
            MONACO GP 2024
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <div
            style={{
              border: "3px solid #3671C6",
              borderRadius: "16px",
              padding: "20px 32px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "#3671C6",
                fontSize: "48px",
                fontWeight: 900,
                fontFamily: "Orbitron",
              }}
            >
              1
            </span>
            <span
              style={{
                color: "#97989B",
                fontSize: "12px",
                letterSpacing: "2px",
                marginTop: "4px",
              }}
            >
              VER
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span
              style={{
                color: "#FFFFFF",
                fontSize: "28px",
                fontWeight: 700,
                textTransform: "uppercase" as const,
              }}
            >
              Max Verstappen
            </span>
            <span
              style={{
                color: "#3671C6",
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "uppercase" as const,
                letterSpacing: "1px",
                marginTop: "4px",
              }}
            >
              Oracle Red Bull Racing
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                marginTop: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "#666",
                    fontSize: "11px",
                    textTransform: "uppercase" as const,
                    letterSpacing: "2px",
                  }}
                >
                  ORIGINAL
                </span>
                <span
                  style={{
                    color: "#97989B",
                    fontSize: "40px",
                    fontWeight: 900,
                    fontFamily: "Orbitron",
                  }}
                >
                  P{from}
                </span>
              </div>
              <span style={{ color: gainColor, fontSize: "28px" }}>→</span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "#666",
                    fontSize: "11px",
                    textTransform: "uppercase" as const,
                    letterSpacing: "2px",
                  }}
                >
                  RESULT
                </span>
                <span
                  style={{
                    color: gainColor,
                    fontSize: "40px",
                    fontWeight: 900,
                    fontFamily: "Orbitron",
                  }}
                >
                  P{to}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginLeft: "16px",
                }}
              >
                <span
                  style={{
                    color: "#666",
                    fontSize: "11px",
                    textTransform: "uppercase" as const,
                    letterSpacing: "2px",
                  }}
                >
                  SCORE
                </span>
                <span
                  style={{
                    color: "#FFD700",
                    fontSize: "40px",
                    fontWeight: 900,
                    fontFamily: "Orbitron",
                  }}
                >
                  {score}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                color: "#97989B",
                fontSize: "10px",
                letterSpacing: "2px",
                textTransform: "uppercase" as const,
              }}
            >
              STRATEGY
            </span>
            {stintParts.map((stint, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: stint.color,
                  }}
                />
                <span style={{ color: "#97989B", fontSize: "13px" }}>
                  L{i === 0 ? "1" : stintParts[i - 1].endLap}-{stint.endLap}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#FFD700",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "3px",
              textTransform: "uppercase" as const,
            }}
          >
            ★ {tier} ★
          </span>
          <span
            style={{
              color: "#E10600",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            Can you beat my strategy? →
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Orbitron",
          data: orbitronData,
          weight: 900,
          style: "normal",
        },
        {
          name: "Chakra Petch",
          data: chakraData,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );
}
```

- [ ] **Step 4: Test the OG route**

Run: `npm run dev`

Visit: `http://localhost:3000/api/og?d=VER&f=6&t=2&s=450&st=S20-M55-H78&tier=Podium%20Hero`

Expected: Renders a 1200×630 PNG image with F1 broadcast-style layout showing Verstappen P6→P2 result.

- [ ] **Step 5: Test the share page**

Visit: `http://localhost:3000/share?d=VER&f=6&t=2&s=450&st=S20-M55-H78&tier=Podium%20Hero`

Expected: Shows the shared result with "Can you beat this?" CTA linking to the home page.

- [ ] **Step 6: Commit**

```bash
git add src/app/share/ src/app/api/og/
git commit -m "feat: add share page and OG image generation route"
```

---

### Post-Implementation Checklist

After completing all tasks, verify the full game loop:

- [ ] **1.** `npm run dev` starts without errors
- [ ] **2.** Challenge Brief shows Verstappen P6→P3 target at Monaco 2024
- [ ] **3.** "Accept Challenge" transitions to Strategy Builder
- [ ] **4.** Strategy Builder validates inputs (try setting 0 pit stops, single compound)
- [ ] **5.** Timeline bar updates in real-time as strategy changes
- [ ] **6.** "Simulate Race" produces result in <2 seconds
- [ ] **7.** Result screen shows correct position change, tier, key moment, score
- [ ] **8.** Result screen shows standings comparison (Actual vs Simulation), top 10 by default
- [ ] **9.** "Full Classification" expands to all 20 drivers with correct position deltas
- [ ] **10.** Verstappen is highlighted in the standings table
- [ ] **11.** "Try Again" returns to Strategy Builder
- [ ] **12.** "Share Result" copies a URL or opens share dialog
- [ ] **13.** Share URL unfurls with OG image on social media (test with `curl -I` to check OG meta tags)
- [ ] **14.** `/share` page re-runs simulation and shows full standings comparison
- [ ] **15.** `/share` page "Can you beat this?" links back to challenge
- [ ] **16.** `npm run build` succeeds
- [ ] **17.** `npm run test` — all 28 tests pass
- [ ] **18.** Baseline simulation produces VER in approximately P6 (tune `race-data.json` base paces if needed)
