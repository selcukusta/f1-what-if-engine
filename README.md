# F1 What-If Engine

A web-based Formula 1 strategy game. Take a real race, change a driver's pit strategy, and see how the result changes.

**MVP Challenge:** Verstappen finished P6 at Monaco 2024. Can you get him to the podium?

## How It Works

1. **Accept the challenge** — see the starting grid and target position
2. **Build your strategy** — choose pit stop laps and tire compounds (Soft, Medium, Hard)
3. **Simulate the race** — all 20 drivers are re-simulated lap-by-lap with your strategy
4. **Share your result** — get an F1 broadcast-style card to share on social media

The simulation is deterministic and runs entirely in the browser (<1ms). Changing Verstappen's strategy creates a butterfly effect across the entire grid through dynamic traffic penalties.

## Tech Stack

- **Next.js** (App Router) — single codebase, single deploy
- **TypeScript** — simulation engine + UI
- **Tailwind CSS v4** — F1 broadcast-style dark theme
- **Vitest** — 28 test cases (validation + simulation)
- **next/og (Satori)** — dynamic OG image generation
- **Vercel** — deployment with edge runtime for OG images

## Project Structure

```
src/
├── engine/          # Pure TypeScript simulation (no React)
│   ├── types.ts     # Shared types
│   ├── constants.ts # Tire model, team colors, tier definitions
│   ├── validate.ts  # Strategy validation rules
│   └── simulate.ts  # Lap-by-lap race simulation + scoring
├── data/
│   ├── race-data.json   # Precomputed Monaco 2024 data (from OpenF1 API)
│   └── challenges.ts    # Challenge definitions
├── components/      # React UI components
│   ├── ChallengeBrief.tsx
│   ├── StrategyBuilder.tsx
│   ├── TireBar.tsx
│   ├── ResultCard.tsx
│   ├── ScoreBadge.tsx
│   └── StandingsComparison.tsx
└── app/
    ├── page.tsx         # Main game (3-view state machine)
    ├── share/           # Share landing page (re-runs simulation)
    └── api/og/          # OG image generation (edge runtime)
```

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

## Simulation Model

Each lap for every driver:

```
lapTime = basePace + tireEffect + degradation + trafficPenalty + pitLoss
```

| Compound | Speed Bonus | Degradation/Lap | Lifetime |
|----------|-------------|-----------------|----------|
| Soft | -1.2s | +0.3s | 15 laps |
| Medium | -0.6s | +0.15s | 25 laps |
| Hard | +0.3s | +0.05s | 35 laps |

Exceeding tire lifetime adds +2.0s per lap. Traffic within 1.5s adds +0.8s, within 3.0s adds +0.3s. Pit stop costs 22s at Monaco.

## License

MIT
