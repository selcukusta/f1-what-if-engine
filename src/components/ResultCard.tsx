"use client";

import { SimResult, UserStrategy, RaceData, Challenge } from "@/engine/types";
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
