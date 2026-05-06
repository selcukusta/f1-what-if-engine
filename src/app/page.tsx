"use client";

import { useState, useMemo } from "react";
import raceDataJson from "@/data/race-data.json";
import { MONACO_2024_CHALLENGE } from "@/data/challenges";
import { RaceData, UserStrategy, SimResult } from "@/engine/types";
import { simulateRace, computeResult } from "@/engine/simulate";
import { useI18n } from "@/i18n/context";
import ChallengeBrief from "@/components/ChallengeBrief";
import StrategyBuilder from "@/components/StrategyBuilder";
import ResultCard from "@/components/ResultCard";

const raceData = raceDataJson as RaceData;
const challenge = MONACO_2024_CHALLENGE;

type GameView = "brief" | "strategy" | "result";

export default function Home() {
  const { t } = useI18n();
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
    const driverName = raceData.drivers.find((d) => d.id === challenge.driverId)?.name ?? "";

    if (navigator.share) {
      navigator.share({
        title: t.result.shareTitle(driverName, challenge.originalPosition, simResult.finalPosition),
        text: t.result.shareText,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert(t.result.linkCopied);
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
