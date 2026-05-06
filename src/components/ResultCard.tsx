"use client";

import { useState } from "react";
import { SimResult, UserStrategy, RaceData, Challenge, PositionChange } from "@/engine/types";
import { userStrategyToStints } from "@/engine/simulate";
import { useI18n } from "@/i18n/context";
import TireBar from "./TireBar";
import ScoreBadge from "./ScoreBadge";
import StandingsComparison from "./StandingsComparison";
import PositionChart from "./PositionChart";

type Props = {
  result: SimResult;
  strategy: UserStrategy;
  raceData: RaceData;
  challenge: Challenge;
  onRetry: () => void;
  onShare: () => void;
};

const PREVIEW_COUNT = 3;

const KIND_ICONS: Record<string, string> = {
  overtake: "↑",
  undercut: "↑",
  overcut: "↑",
  "lost-position": "↓",
  "tire-cliff": "⚠",
};

function formatMoment(pc: PositionChange, t: ReturnType<typeof useI18n>["t"]): string {
  const icon = KIND_ICONS[pc.kind] ?? "";
  const labels: Record<string, string> = {
    overtake: t.moments.overtake,
    undercut: t.moments.undercut,
    overcut: t.moments.overcut,
    "lost-position": t.moments.lostPosition,
    "tire-cliff": t.moments.tireCliff,
  };
  const label = labels[pc.kind] ?? pc.kind;
  const isGain = pc.newPosition < pc.oldPosition;
  const detail = isGain
    ? t.moments.passed(pc.otherDriverName, pc.newPosition)
    : t.moments.dropped(pc.newPosition);
  return `${icon} Lap ${pc.lap}: ${label} — ${detail}`;
}

function KeyMoments({ changes }: { changes: PositionChange[] }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  if (changes.length === 0) {
    return (
      <div className="f1-card mb-4 text-left border-l-[3px] border-f1-red">
        <p className="f1-label text-f1-red mb-2">{t.result.keyMoments}</p>
        <p className="text-white text-sm font-body">{t.moments.noChanges}</p>
      </div>
    );
  }

  const hasMore = changes.length > PREVIEW_COUNT;
  const visible = expanded ? changes : changes.slice(0, PREVIEW_COUNT);

  return (
    <div className="f1-card mb-4 text-left border-l-[3px] border-f1-red">
      <p className="f1-label text-f1-red mb-2">
        {t.result.keyMoments}
        {changes.length > 1 && (
          <span className="text-f1-grey/60 font-normal ml-1">({changes.length})</span>
        )}
      </p>
      <div className="space-y-1">
        {visible.map((pc, i) => (
          <p key={i} className="text-white text-sm font-body">
            {formatMoment(pc, t)}
          </p>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-f1-red text-xs font-body font-bold mt-2 hover:underline"
        >
          {expanded ? t.result.showLess : t.result.showAll(changes.length)}
        </button>
      )}
    </div>
  );
}

export default function ResultCard({
  result,
  strategy,
  raceData,
  challenge,
  onRetry,
  onShare,
}: Props) {
  const { t } = useI18n();
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
            <p className="f1-label mb-1">{t.result.was}</p>
            <p className="f1-number text-5xl text-f1-grey">
              P{result.originalPosition}
            </p>
          </div>
          <div className={`text-3xl ${gainColor}`}>→</div>
          <div>
            <p className="f1-label mb-1">{t.result.now}</p>
            <p className={`f1-number text-5xl ${gainColor}`}>
              P{result.finalPosition}
            </p>
          </div>
        </div>

        {result.positionsGained !== 0 && (
          <p className={`font-body font-bold text-sm ${gainColor} mb-6`}>
            {result.positionsGained > 0
              ? t.result.positionsGained(result.positionsGained)
              : t.result.positionsLost(result.positionsGained)}
          </p>
        )}

        <div className="mb-2">
          <p className="f1-heading text-lg">{driver.name}</p>
          <p className="text-f1-grey text-sm font-body">
            {raceData.race.name} {raceData.race.year}
          </p>
        </div>

        <div className="f1-card mb-4 text-left">
          <p className="f1-label mb-2">{t.result.yourStrategy}</p>
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

        <KeyMoments changes={result.positionChanges} />

        <div className="mb-6">
          <p className="f1-label mb-1">{t.result.score}</p>
          <p className="f1-number text-4xl">{result.score}</p>
        </div>

        <StandingsComparison
          allDriverResults={result.allDriverResults}
          challengeDriverId={challenge.driverId}
          raceData={raceData}
        />

        <PositionChart
          allPositionsPerLap={result.allPositionsPerLap}
          challengeDriverId={challenge.driverId}
          raceData={raceData}
          pitLaps={strategy.pitLaps}
          compounds={strategy.compounds}
        />

        <div className="flex gap-3 max-w-xs mx-auto">
          <button onClick={onShare} className="f1-button flex-1">
            {t.result.shareButton}
          </button>
          <button onClick={onRetry} className="f1-button-outline flex-1">
            {t.result.retryButton}
          </button>
        </div>
      </div>
    </div>
  );
}
