# F1 What-If Engine — Design Spec

## Overview

A viral, web-based Formula 1 strategy game. Users take a real F1 race, change a driver's pit strategy, and see how the result changes. Fast, fun, shareable.

**Core concept:** "Change strategy, change the race outcome."

**MVP challenge:** "Verstappen finished P6 at Monaco 2024. Can you get him to the podium?"

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Race | 2024 Monaco GP | Strategy-decisive track, famous race, top 10 finished in quali order (unprecedented) |
| Challenge driver | Max Verstappen (P6 → Podium) | Biggest name, biggest swing, most shareable |
| Tech stack | Next.js fullstack | Single codebase, single deploy, sim is simple math |
| Simulation location | Client-side (browser) | Instant feedback, zero server cost per sim |
| Share mechanism | Dynamic OG image cards | F1 broadcast-style card, unfurls on social media |
| Leaderboard | Session-only for MVP | Validate game loop first, add persistence later |
| Red flag handling | Ignored — clean 78-lap race | More strategic freedom, more fun |
| Deployment | Vercel | Natural Next.js fit, free tier, built-in OG support |

## Architecture

Three layers, cleanly separated:

### 1. Data Layer (Build Time)

A build-time script fetches from OpenF1 API, cleans/normalizes the data, computes base pace per driver, and outputs a static `race-data.json`. This file ships as a static asset. No runtime API calls to OpenF1.

**OpenF1 API identifiers:**
- meeting_key: `1236`
- Race session_key: `9523`
- circuit_key: `22` (Monte Carlo)

**Data fetched:**
- Lap times per driver
- Stint data (tire compounds, stint lengths)
- Position data
- Pit stop timing

### 2. Simulation Layer (Client-Side)

A pure function: `simulate(raceData, userStrategy) → SimResult`. Runs in the browser. Deterministic, testable, no side effects. ~20 drivers × 78 laps = ~1560 calculations per simulation.

All 20 drivers are simulated dynamically using the same formula. Base pace per driver comes from real data, but positions and gaps are computed lap by lap. This prevents exploitation — users cannot memorize gap windows because the gaps change based on their strategy choices. Changing Verstappen's strategy creates a butterfly effect across the entire grid.

### 3. Share Layer (Server-Side)

A single Next.js API route (`/api/og`) generates a dynamic OG image using `next/og` (Satori). Result is encoded in URL params. F1 broadcast-style card renders when the share URL is pasted on social media.

## Data Model

### RaceData (precomputed, static JSON)

```typescript
type RaceData = {
  race: {
    name: string         // "Monaco Grand Prix"
    year: number         // 2024
    totalLaps: number    // 78
    pitLossSec: number   // 22
  }
  drivers: DriverData[]
}

type DriverData = {
  id: string              // "VER", "LEC", etc.
  name: string            // "Max Verstappen"
  team: string            // "Red Bull"
  teamColor: string       // "#3671C6"
  gridPosition: number
  basePaceSec: number     // clean lap average from real data
  defaultStrategy: Stint[]
}

type Stint = {
  startLap: number
  endLap: number
  compound: "soft" | "medium" | "hard"
}
```

### UserStrategy (input)

```typescript
type UserStrategy = {
  pitLaps: number[]                          // e.g. [20, 45]
  compounds: ("soft" | "medium" | "hard")[]  // e.g. ["medium", "hard", "medium"]
  // compounds.length = pitLaps.length + 1 (one per stint)
}
```

### SimResult (output)

```typescript
type SimResult = {
  finalPosition: number
  originalPosition: number       // 6
  positionsGained: number
  totalTimeSec: number
  lapTimes: number[]             // per-lap for Verstappen
  allPositions: number[][]       // position per lap per driver
  allDriverResults: { driverId: string; finalPosition: number }[]  // full grid result
  score: number
  keyMoment: string              // "Undercut on Lap 22 gained P5"
  tier: string                   // "Podium Hero"
}
```

## Simulation Engine

### Lap Time Formula

For every driver, every lap:

```
lapTime = basePace + tireEffect + degradation + trafficPenalty
```

On pit laps, add `pitLossSec` (22s for Monaco).

### Tire Model

| Compound | tireEffect | degradation/lap | lifetime | over-lifetime penalty |
|----------|-----------|-----------------|----------|----------------------|
| Soft     | -1.2s     | +0.3s           | 15 laps  | +2.0s/lap            |
| Medium   | -0.6s     | +0.15s          | 25 laps  | +2.0s/lap            |
| Hard     | +0.3s     | +0.05s          | 35 laps  | +2.0s/lap            |

`tireEffect` is applied every lap. `degradation` accumulates: on lap N of a stint, degradation = `degradationRate × (N - 1)`. After exceeding lifetime, add `+2.0s` per additional lap.

### Traffic Model

After each lap, sort all drivers by cumulative race time. For each driver, compute gap to car ahead:

| Gap to car ahead | Penalty |
|-----------------|---------|
| < 1.5s          | +0.8s   |
| < 3.0s          | +0.3s   |
| ≥ 3.0s          | 0       |

### Position Tracking

After each lap, sort all drivers by cumulative race time → that's the running order. Traffic penalties reference this live order, not historical data.

### Key Design Properties

- **Deterministic:** Same input always produces the same output
- **Dynamic field:** All 20 drivers simulated with the same formula, positions emerge from the math
- **Butterfly effect:** Changing Verstappen's strategy ripples through the grid via traffic penalties
- **Only Verstappen's strategy changes:** Other 19 drivers use reasonable default strategies derived from real data (adapted for no-red-flag scenario)
- **Full 20-driver grid:** Since we ignore the Lap 1 red flag/crash, all 20 drivers race the full 78 laps (including Perez, Ocon, Hulkenberg, Magnussen who DNF'd in reality). Their base pace is derived from qualifying data and team performance.

## Challenge Definition

```typescript
type Challenge = {
  id: string
  title: string                    // "Rescue the Champion"
  description: string              // "Verstappen finished P6. Can you get him to the podium?"
  raceId: string                   // "monaco-2024"
  driverId: string                 // "VER"
  originalPosition: number         // 6
  targetPosition: number           // 3
  maxPitStops: number              // 2
  allowedCompounds: Compound[]     // ["soft", "medium", "hard"]
  rules: {
    minPitStops: 1
    minCompounds: 2
    minLapsBetweenStops: 5
  }
}
```

### Strategy Validation

Before simulation runs:
- At least 1 pit stop
- At least 2 different tire compounds used
- No more than `maxPitStops` stops (2 for MVP)
- Each stint is at least 5 laps
- Pit laps within valid range (lap 2 to lap 73)

### Result Tiers

| Result | Tier Label |
|--------|-----------|
| P1     | "Strategy God" |
| P2     | "Podium Hero" |
| P3     | "Mission Complete" |
| P4-P5  | "Getting Closer" |
| P6     | "Back to the Drawing Board" |
| P7+    | "That Wasn't the Plan" |

### Score Formula

```
score = positionsGained × 100 + timeDeltaVsOriginal × 10 - numberOfPits × 50
```

- `positionsGained`: originalPosition (6) minus finalPosition (e.g., 2 → gain of 4). Negative if worse.
- `timeDeltaVsOriginal`: seconds faster than the baseline simulation where Verstappen runs his default strategy. Rewards efficient strategies even if position doesn't change.
- `numberOfPits`: total pit stops made. Penalizes extra stops to reward clean strategies.

### Key Moment Generation

The simulation tracks position changes per lap. The `keyMoment` string describes the single most impactful event:
- If a position was gained on a pit lap (undercut/overcut): "Undercut on Lap N jumped [Driver] for P[X]"
- If a position was gained on track (traffic advantage): "Passed [Driver] on Lap N for P[X]"
- If no positions gained: "Closest to overtake: within [X]s of [Driver] on Lap N"

Pick the moment with the largest single position change. If tied, pick the earliest.

## Gameplay Flow

Three screens, linear progression:

### Screen 1: Challenge Brief

- Challenge title: "Rescue the Champion"
- Driver name, team, grid position
- Context: "Verstappen finished P6 at Monaco 2024. Can you get him to the podium?"
- CTA: "Accept Challenge"

### Screen 2: Strategy Builder

- Header: challenge context (driver, race, laps)
- Race timeline bar showing current strategy as colored segments
- Starting tire selector (Soft / Medium / Hard toggle)
- Pit Stop 1: lap number input (+/- buttons) + next tire compound selector
- Pit Stop 2: lap number input (+/- buttons) + next tire compound selector
- Timeline bar updates in real-time as user adjusts
- CTA: "Simulate Race"

### Screen 3: Result

- Tier banner ("Podium Hero")
- Hero position change: giant P6 → P2 with arrow
- Positions gained indicator
- Driver name + race
- Strategy summary bar (colored segments)
- Key moment callout (e.g., "Undercut on Lap 20 jumped Sainz for P3")
- Score display
- **Standings comparison table:** Actual race vs simulation, top 10 by default
  - Verstappen highlighted in team color
  - Displaced drivers shown with ↑/↓ arrows
  - "Full Classification" CTA expands to all 20 drivers
- CTAs: "Share Result" / "Try Again"

## Share Flow

1. User clicks "Share Result"
2. Generate share URL: `f1whatif.vercel.app/share?d=VER&f=6&t=2&s=450&st=S20-M55-H&tier=podium`
3. URL params encode the result (no server-side storage needed)
4. When pasted on social media, the platform fetches OG meta tags from the share page
5. `/api/og` route renders an F1 broadcast-style card as PNG

### URL Parameters

| Param | Description | Example |
|-------|-------------|---------|
| d | Driver ID | VER |
| f | From position | 6 |
| t | To position | 2 |
| s | Score | 450 |
| st | Strategy | S20-M55-H |
| tier | Tier label | podium |

### Share Page (`/share`)

- Renders the hero result card (position change, tier, score)
- **Full standings comparison table:** Actual race vs simulation (same component as Result screen)
  - Share page re-runs the simulation client-side from strategy params in the URL (deterministic = identical result)
  - Top 10 by default, "Full Classification" expands to all 20
- "Can you beat this?" CTA → links to challenge page
- Viral loop: see result → try challenge → share own result

### OG Image Card (F1 Broadcast Style)

1200×630 PNG rendered server-side. Styled like an F1 TV graphic:
- F1 red accent line at top
- Driver number badge with team color border
- Driver name + team
- Position change (P6 → P2) + score
- Strategy shown as colored dots with lap ranges
- Tier badge
- "Can you beat my strategy?" CTA

## Visual Identity

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background | #15151E | F1 broadcast dark |
| Surface | #1E1E2D | Cards, panels |
| F1 Red | #E10600 | Primary accent, CTAs |
| White | #FFFFFF | Headlines, primary text |
| Grey | #97989B | Secondary text, labels |
| Gain | #00FF87 | Positions gained |
| Loss | #FF4444 | Positions lost |
| Gold | #FFD700 | Score, tier accent |

### Tire Compound Colors (Official Pirelli)

| Compound | Hex |
|----------|-----|
| Soft | #DA291C |
| Medium | #FFD700 |
| Hard | #FFFFFF |

### Team Colors (2024 Official)

| Team | Hex |
|------|-----|
| Red Bull | #3671C6 |
| Ferrari | #E8002D |
| McLaren | #FF8000 |
| Mercedes | #27F4D2 |
| RB | #6692FF |
| Williams | #64C4FF |
| Alpine | #0093CC |
| Aston Martin | #229971 |
| Sauber | #52E252 |
| Haas | #B6BABD |

### Typography

Two-font system from Google Fonts (SIL Open Font License):

- **Orbitron Black (900)** — position numbers (P6, P2), scores, big hero numerics. Wide, chunky, geometric.
- **Chakra Petch Bold (700) / SemiBold (600)** — driver names, labels, UI text, CTAs. Angular terminal cuts match F1 Display's signature feature.

Usage:
- Headlines/names: Chakra Petch 700, uppercase, letter-spacing 0.5px
- Labels: Chakra Petch 600, uppercase, letter-spacing 3px
- Numbers/positions: Orbitron 900
- Body/descriptions: Chakra Petch 600

## Project Structure

```
f1-what-if-engine/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout, fonts, metadata
│   │   ├── page.tsx                  # Challenge brief screen
│   │   ├── strategy/
│   │   │   └── page.tsx              # Strategy builder screen
│   │   ├── result/
│   │   │   └── page.tsx              # Result screen
│   │   ├── share/
│   │   │   └── page.tsx              # Share landing page
│   │   └── api/
│   │       └── og/
│   │           └── route.tsx         # OG image generation endpoint
│   ├── engine/
│   │   ├── simulate.ts              # Pure simulation function
│   │   ├── types.ts                 # All shared types
│   │   └── validate.ts              # Strategy validation rules
│   ├── data/
│   │   ├── race-data.json           # Precomputed Monaco 2024 data
│   │   └── challenges.ts            # Challenge definitions
│   └── components/
│       ├── StrategyBuilder.tsx       # Pit stop + tire selector UI
│       ├── TireBar.tsx              # Visual timeline bar
│       ├── ResultCard.tsx           # Result display component
│       └── ScoreBadge.tsx           # Tier badge component
├── scripts/
│   └── fetch-race-data.ts           # OpenF1 data fetcher + preprocessor
├── public/
│   └── fonts/                        # (using Google Fonts CDN instead)
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Key Architectural Boundaries

- **`engine/`** — framework-agnostic, pure TypeScript. No React, no Next.js imports. Can run in browser or Node.js. This is the simulation core.
- **`data/`** — static precomputed data. Generated by `scripts/fetch-race-data.ts` at build time.
- **`components/`** — React UI components. Consume engine output, render screens.
- **`app/api/og/`** — the only server-side route. Generates OG image PNGs.

## Performance

- Simulation: <1ms in browser (pure arithmetic, ~1560 calculations)
- Page load: static assets, Google Fonts CDN
- OG image: generated on-demand by Vercel edge function, cached by CDN
- No runtime API calls to OpenF1 — all data is precomputed

## MVP Scope

Included:
- 1 race (Monaco 2024)
- 1 challenge (Verstappen P6 → Podium)
- Max 2 pit stops
- 3 tire compounds (Soft, Medium, Hard)
- 3 screens (Challenge Brief → Strategy Builder → Result)
- OG image share cards
- Session-only scoring (no persistence)

Excluded:
- Weather effects
- Multiple races
- User accounts / authentication
- Persistent leaderboard
- DRS zones
- Safety car / VSC
- Tire temperature model
- Fuel load effects

## Success Criteria

- User can complete a simulation within 10 seconds of landing
- User understands the result instantly (tier label, position change)
- User wants to retry (try different strategy)
- User wants to share (OG card is compelling enough to post)
