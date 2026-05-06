"use client";

import { useState, useMemo } from "react";
import { CHALLENGES, getRaceDataForChallenge } from "@/data/challenges";
import { Challenge, UserStrategy, SimResult } from "@/engine/types";
import { simulateRace, computeResult } from "@/engine/simulate";
import { useI18n } from "@/i18n/context";
import ChallengeBrief from "@/components/ChallengeBrief";
import StrategyBuilder from "@/components/StrategyBuilder";
import ResultCard from "@/components/ResultCard";

type GameView = "select" | "brief" | "strategy" | "result";

export default function Home() {
  const { locale, t } = useI18n();
  const [activeChallenge, setActiveChallenge] = useState<Challenge>(
    CHALLENGES.length === 1 ? CHALLENGES[0] : null!
  );
  const [view, setView] = useState<GameView>(
    CHALLENGES.length === 1 ? "brief" : "select"
  );
  const [userStrategy, setUserStrategy] = useState<UserStrategy | null>(null);
  const [simResult, setSimResult] = useState<SimResult | null>(null);

  const challenge = activeChallenge;
  const raceData = useMemo(
    () => (challenge ? getRaceDataForChallenge(challenge) : null),
    [challenge]
  );

  const baselineOutput = useMemo(() => {
    if (!challenge || !raceData) return null;
    const driver = raceData.drivers.find((d) => d.id === challenge.driverId);
    if (!driver) return null;
    const defaultStrategy: UserStrategy = {
      pitLaps: driver.defaultStrategy.slice(0, -1).map((s) => s.endLap),
      compounds: driver.defaultStrategy.map((s) => s.compound),
    };
    return simulateRace(raceData, challenge.driverId, defaultStrategy);
  }, [challenge, raceData]);

  function handleSelectChallenge(c: Challenge) {
    setActiveChallenge(c);
    setView("brief");
  }

  function handleAccept() {
    setView("strategy");
  }

  function handleSimulate(strategy: UserStrategy) {
    if (!raceData || !baselineOutput) return;
    const output = simulateRace(raceData, challenge.driverId, strategy);
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
    if (!simResult || !userStrategy || !raceData) return;

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
      c: challenge.id,
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

  function handleBackToSelect() {
    setSimResult(null);
    setUserStrategy(null);
    setView(CHALLENGES.length === 1 ? "brief" : "select");
  }

  if (view === "select") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="max-w-lg w-full text-center">
          <p className="f1-label text-f1-red mb-4">F1 WHAT-IF ENGINE</p>
          <h1 className="f1-heading text-3xl mb-8">
            {locale === "tr" ? "Bir Meydan Okuma Seç" : "Choose a Challenge"}
          </h1>
          <div className="space-y-4">
            {CHALLENGES.map((c) => {
              const texts = c.texts[locale] ?? c.texts.en;
              const cRaceData = getRaceDataForChallenge(c);
              const driver = cRaceData.drivers.find((d) => d.id === c.driverId);
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectChallenge(c)}
                  className="f1-card w-full text-left p-6 hover:border-f1-red/50 transition-colors cursor-pointer"
                >
                  <p className="f1-label text-f1-red text-[10px] mb-1">
                    {cRaceData.race.name} {cRaceData.race.year}
                  </p>
                  <p className="f1-heading text-lg mb-1">{texts.title}</p>
                  <p className="text-f1-grey font-body text-sm mb-3">{texts.description}</p>
                  {driver && (
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block w-1 h-5 rounded-sm"
                        style={{ backgroundColor: driver.teamColor }}
                      />
                      <span className="font-body text-sm text-white">{driver.name}</span>
                      <span className="text-f1-grey text-xs">P{c.originalPosition} → P{c.targetPosition}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!challenge || !raceData) return null;

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
