# F1 What-If Engine

A viral, web-based Formula 1 strategy game. Take a real race, change a driver's pit strategy, and see how the result changes across the entire grid.

**MVP Challenge:** Verstappen finished P6 at Monaco 2024. Can you get him to the podium?

## How It Works

1. **Accept the challenge** — see the starting grid, target position, and race context
2. **Build your strategy** — drag pit stop laps and choose tire compounds (Soft, Medium, Hard)
3. **Simulate the race** — all 20 drivers are re-simulated lap-by-lap with your strategy
4. **Analyze the result** — race progress chart, key moments, standings comparison
5. **Share your result** — shareable link with full strategy replay

The simulation is **deterministic** and runs entirely in the browser (<1ms). Changing Verstappen's strategy creates a butterfly effect across the entire grid through traffic dynamics, dirty air, and pit timing.

## Features

- **Race Progress Chart** — interactive Recharts line chart showing lap-by-lap positions for up to 10 drivers, with tire compound markers at pit stops
- **Key Moments** — structured narrative of overtakes, undercuts, overcuts, lost positions, and tire cliff events with collapsible detail view
- **Standings Comparison** — side-by-side actual vs. simulated finishing order for all 20 drivers
- **Internationalization** — English and Turkish language support with instant toggle
- **Social Sharing** — shareable links that re-run the simulation, plus OG image generation
- **Tier System** — results ranked from Legendary to Worse with localized badge labels

## Tech Stack

- **Next.js 16** (App Router) — single codebase, single deploy
- **TypeScript** — simulation engine + UI
- **Tailwind CSS v4** — F1 broadcast-style dark theme (Orbitron + Chakra Petch typography)
- **Recharts** — race progress visualization
- **Vitest** — 29 test cases (validation + simulation)
- **next/og (Satori)** — dynamic OG image generation
- **Vercel** — deployment with edge runtime for OG images

## Project Structure

```
src/
├── engine/              # Pure TypeScript simulation (no React)
│   ├── types.ts         # Shared types (SimOutput, PositionChange, etc.)
│   ├── constants.ts     # Tire model, physics constants, team colors
│   ├── validate.ts      # Strategy validation rules (i18n-aware)
│   └── simulate.ts      # Lap-by-lap race simulation + scoring
├── data/
│   ├── race-data.json   # Precomputed Monaco 2024 data (from OpenF1 API)
│   └── challenges.ts    # Challenge definitions
├── components/          # React UI components
│   ├── ChallengeBrief.tsx
│   ├── StrategyBuilder.tsx
│   ├── TireBar.tsx
│   ├── ResultCard.tsx
│   ├── ScoreBadge.tsx
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
    ├── share/           # Share landing page (re-runs simulation)
    └── api/og/          # OG image generation (edge runtime)
```

## Simulation Model

The engine simulates all 20 drivers lap-by-lap with context-aware physics:

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

| Factor | Effect | Value |
|--------|--------|-------|
| Fuel burn | Cars get faster as fuel load decreases | -0.03s/lap |
| Cold tires | Out-lap penalty on fresh tires (non-first stint) | +1.5s |
| Dirty air degradation | Tires degrade 20% faster when within 1.5s of car ahead | 1.2x multiplier |
| Pace ceiling | Faster car blocked unless pace delta exceeds threshold | 2.0s required |
| Dirty air margin | Stuck car sits behind leader at fixed gap | +0.2s behind |
| Pit stop loss | Time lost entering/exiting pits (Monaco) | 22s |

The Monaco overtake threshold (2.0s) makes the **undercut** the primary way to gain positions — just like the real Monaco GP.

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

Race data is precomputed from the [OpenF1 API](https://openf1.org). To regenerate:

```bash
npx tsx scripts/fetch-race-data.ts
```

This fetches lap times, stints, and driver data for the 2024 Monaco GP (session 9523), computes base pace per driver, and writes `src/data/race-data.json`.

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
