# F1 What-If Engine

A viral, web-based Formula 1 strategy game. Pick a real race, change a driver's pit strategy, and see how the result changes across the entire grid.

## Challenges

| Race | Driver | Challenge | Goal |
|------|--------|-----------|------|
| Miami 2026 | Norris | Defend the Win | Keep P1 — Norris had pole and fastest lap but lost to Antonelli |
| Monaco 2024 | Verstappen | Rescue the Champion | Reach the podium from P6 |

## How It Works

1. **Pick a challenge** — swipe through available races with difficulty badges
2. **Build your strategy** — drag pit stop laps and choose tire compounds (Soft, Medium, Hard)
3. **Simulate the race** — all 20 drivers are re-simulated lap-by-lap with your strategy
4. **Analyze the result** — race progress chart, key moments, standings comparison, butterfly effect
5. **Share your result** — shareable link with full strategy replay

The simulation is **deterministic** and runs entirely in the browser (<1ms). Changing one driver's strategy creates a butterfly effect across the entire grid through traffic dynamics, dirty air, and pit timing.

## Features

- **Multi-Challenge** — swipeable challenge slider with difficulty badges and per-track physics
- **Race Progress Chart** — interactive Recharts line chart showing lap-by-lap positions for up to 10 drivers, with tire compound markers at pit stops
- **Key Moments** — structured narrative of overtakes, undercuts, overcuts, lost positions, and tire cliff events with collapsible detail view
- **Butterfly Effect** — highlights the rival most impacted by your strategy change, picking counter-narratives for storytelling
- **Standings Comparison** — side-by-side actual vs. simulated finishing order for all 20 drivers
- **Position Hero** — animated position delta display on the result screen
- **Internationalization** — English and Turkish language support with instant toggle
- **Social Sharing** — shareable links that re-run the simulation, plus OG image generation
- **Tier System** — relative results ranked from Legendary to Worse with localized badge labels
- **DNF Handling** — DNF drivers are excluded from simulation with penalty-based finishing positions

## Tech Stack

- **Next.js 16** (App Router) — single codebase, single deploy
- **TypeScript** — simulation engine + UI
- **Tailwind CSS v4** — F1 broadcast-style dark theme (Orbitron + Chakra Petch typography)
- **Recharts** — race progress visualization
- **Vitest** — 30 test cases (validation + simulation)
- **next/og (Satori)** — dynamic OG image generation
- **Vercel** — deployment with edge runtime for OG images

## Project Structure

```
src/
├── engine/              # Pure TypeScript simulation (no React)
│   ├── types.ts         # Shared types (SimOutput, ButterflyEffect, etc.)
│   ├── constants.ts     # Tire model, physics constants, team colors
│   ├── validate.ts      # Strategy validation rules (i18n-aware)
│   └── simulate.ts      # Lap-by-lap race simulation + scoring
├── data/
│   ├── monaco-2024.json # Precomputed Monaco 2024 data (from OpenF1 API)
│   ├── miami-2026.json  # Precomputed Miami 2026 data (from OpenF1 API)
│   └── challenges.ts    # Challenge definitions and race data registry
├── components/          # React UI components
│   ├── ChallengeBrief.tsx
│   ├── StrategyBuilder.tsx
│   ├── TireBar.tsx
│   ├── ResultCard.tsx
│   ├── ScoreBadge.tsx
│   ├── PositionHero.tsx
│   ├── StandingsComparison.tsx
│   └── PositionChart.tsx
├── i18n/                # Internationalization
│   ├── types.ts         # Translation interface
│   ├── en.ts            # English translations
│   ├── tr.ts            # Turkish translations
│   └── context.tsx      # I18nProvider, useI18n hook, LanguageToggle
└── app/
    ├── page.tsx         # Main game (3-view state machine)
    ├── Providers.tsx    # Client wrapper for context providers
    ├── share/
    │   ├── page.tsx     # Share landing page (re-runs simulation)
    │   └── ShareContent.tsx
    └── api/og/          # OG image generation (edge runtime)
```

## Simulation Model

The engine simulates all 20 drivers lap-by-lap with context-aware, per-track physics:

```
lapTime = basePace + tireEffect + degradation - fuelBurn + coldTirePenalty + paceCeiling + pitLoss
```

### Tire Compounds

| Compound | Speed Bonus | Degradation/Lap | Lifetime |
|----------|-------------|-----------------|----------|
| Soft     | -1.2s       | +0.3s           | 15 laps  |
| Medium   | -0.6s       | +0.15s          | 25 laps  |
| Hard     | +0.3s       | +0.05s          | 35 laps  |

Exceeding tire lifetime adds +2.0s/lap cliff penalty.

### Physics Model

Default values shown — each track can override overtake difficulty and dirty air margin.

| Factor | Effect | Default |
|--------|--------|---------|
| Fuel burn | Cars get faster as fuel load decreases | -0.03s/lap |
| Cold tires | Out-lap penalty on fresh tires (non-first stint) | +1.5s |
| Dirty air degradation | Tires degrade faster when within 1.5s of car ahead | 1.2x multiplier |
| Pace ceiling | Faster car blocked unless pace delta exceeds threshold | 2.0s (Monaco), varies per track |
| Dirty air margin | Stuck car sits behind leader at fixed gap | +0.2s behind |
| Pit stop loss | Time lost entering/exiting pits | 22s (Monaco), varies per track |
| Traffic penalties | Graduated time loss based on proximity to car ahead | +0.8s (<1.5s gap), +0.3s (<3.0s gap) |

Monaco's high overtake threshold (2.0s) makes the **undercut** the primary way to gain positions — just like the real Monaco GP. Miami's lower threshold allows more on-track overtaking.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

### Regenerating Race Data

Race data is precomputed from the [OpenF1 API](https://openf1.org). Each race has its own fetch script:

```bash
npx tsx scripts/fetch-monaco-2024.ts
npx tsx scripts/fetch-miami-2026.ts
```

Each script fetches lap times, stints, and driver data for its race, computes base pace per driver, and writes the corresponding JSON file in `src/data/`.

## Deployment

Deploy to Vercel:

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repository at [vercel.com/new](https://vercel.com/new) for automatic deployments on push.

No environment variables or special configuration required. The OG image route runs on Vercel Edge Functions automatically.

## License

MIT
