"use client";

import { useState, useEffect, useRef } from "react";
import { SimResult, UserStrategy, RaceData, Challenge, PositionChange, ButterflyEffect } from "@/engine/types";
import { userStrategyToStints } from "@/engine/simulate";
import { useI18n } from "@/i18n/context";
import TireBar from "./TireBar";
import ScoreBadge from "./ScoreBadge";
import PositionHero from "./PositionHero";
import StandingsComparison from "./StandingsComparison";
import PositionChart from "./PositionChart";

type Props = {
  result: SimResult;
  strategy: UserStrategy;
  raceData: RaceData;
  challenge: Challenge;
  onRetry: () => void;
  onShare: () => void;
  onHome: () => void;
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

function KeyMoments({ changes, currentLap }: { changes: PositionChange[]; currentLap: number }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const visibleChanges = changes.filter((pc) => pc.lap <= currentLap);

  if (visibleChanges.length === 0) {
    return (
      <div className="f1-card mb-4 text-left border-l-[3px] border-f1-red">
        <p className="f1-label text-f1-red mb-2">{t.result.keyMoments}</p>
        <p className="text-white text-sm font-body">{t.moments.noChanges}</p>
      </div>
    );
  }

  const hasMore = visibleChanges.length > PREVIEW_COUNT;
  const visible = expanded ? visibleChanges : visibleChanges.slice(0, PREVIEW_COUNT);

  return (
    <div className="f1-card mb-4 text-left border-l-[3px] border-f1-red">
      <p className="f1-label text-f1-red mb-2">
        {t.result.keyMoments}
        {visibleChanges.length > 1 && (
          <span className="text-f1-grey/60 font-normal ml-1">({visibleChanges.length})</span>
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
          {expanded ? t.result.showLess : t.result.showAll(visibleChanges.length)}
        </button>
      )}
    </div>
  );
}

function ButterflyEffectCard({ effect }: { effect: ButterflyEffect }) {
  const { t } = useI18n();
  const isGain = effect.positionDelta > 0;
  const abs = Math.abs(effect.positionDelta);

  return (
    <div className="f1-card mb-4 text-left border-l-[3px] border-yellow-400">
      <p className="f1-label text-yellow-400 mb-2">{t.butterfly.title}</p>
      <div className="flex items-center gap-3 mb-2">
        <span
          className="inline-block w-1.5 h-6 rounded-sm"
          style={{ backgroundColor: effect.teamColor }}
        />
        <span className="font-body text-sm text-white">{effect.driverName}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="f1-number text-lg text-f1-grey">P{effect.baselinePosition}</span>
        <span className="text-f1-grey">→</span>
        <span className={`f1-number text-lg ${isGain ? "text-f1-gain" : "text-f1-loss"}`}>
          P{effect.newPosition}
        </span>
      </div>
      <p className={`text-xs font-body ${isGain ? "text-f1-gain" : "text-f1-loss"}`}>
        {isGain
          ? t.butterfly.gained(effect.driverName, abs)
          : t.butterfly.lost(effect.driverName, abs)}
      </p>
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
  onHome,
}: Props) {
  const { t } = useI18n();
  const driver = raceData.drivers.find((d) => d.id === challenge.driverId);
  if (!driver) return null;

  const stints = userStrategyToStints(strategy, raceData.race.totalLaps);

  const totalLaps = raceData.race.totalLaps;
  const [currentLap, setCurrentLap] = useState(1);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrentLap(1);
    const duration = Math.ceil(totalLaps / 10) * 2000;
    let start: number | null = null;

    function tick(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      setCurrentLap(Math.max(1, Math.round(eased * totalLaps)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [totalLaps]);

  const raceFinished = currentLap >= totalLaps;

  const livePosition = (() => {
    const dp = result.allPositionsPerLap.find((d) => d.driverId === challenge.driverId);
    if (!dp) return result.finalPosition;
    const idx = Math.min(currentLap - 1, dp.positions.length - 1);
    return dp.positions[idx];
  })();
  const liveGain = result.originalPosition - livePosition;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-6 sm:py-12">
      <div className="max-w-md w-full text-center">
        <div className={`transition-opacity duration-700 ${raceFinished ? "opacity-100" : "opacity-0"}`}>
          <ScoreBadge tier={result.tier} />
        </div>

        <PositionHero
          from={result.originalPosition}
          to={livePosition}
          positionsGained={liveGain}
        />

        <div className="f1-card mb-4 text-left">
          <p className="f1-label mb-2">{driver.name} / {raceData.race.name} {raceData.race.year}<br />{t.result.yourStrategy}</p>
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

        <PositionChart
          allPositionsPerLap={result.allPositionsPerLap}
          challengeDriverId={challenge.driverId}
          raceData={raceData}
          pitLaps={strategy.pitLaps}
          compounds={strategy.compounds}
          currentLap={currentLap}
        />

        <StandingsComparison
          allDriverResults={result.allDriverResults}
          allPositionsPerLap={result.allPositionsPerLap}
          challengeDriverId={challenge.driverId}
          raceData={raceData}
          currentLap={currentLap}
        />

        <KeyMoments changes={result.positionChanges} currentLap={currentLap} />

        {result.butterflyEffect && (
          <ButterflyEffectCard effect={result.butterflyEffect} />
        )}

        <div className="mb-6">
          <p className="f1-label mb-1">{t.result.score}</p>
          <p className="f1-number text-4xl">{result.score}</p>
        </div>

        <div className="flex gap-3 max-w-xs mx-auto">
          <button onClick={onShare} className="f1-button flex-1">
            {t.result.shareButton}
          </button>
          <button onClick={onRetry} className="f1-button-outline flex-1">
            {t.result.retryButton}
          </button>
        </div>
        <button
          onClick={onHome}
          className="mt-3 text-f1-grey text-xs font-body font-bold uppercase tracking-wider hover:text-white transition-colors"
        >
          {t.result.homeButton}
        </button>
      </div>
    </div>
  );
}
