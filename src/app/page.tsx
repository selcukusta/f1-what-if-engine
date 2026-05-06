"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
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
      challenge.targetPosition,
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const slideWidth = el.offsetWidth;
    const idx = Math.round(el.scrollLeft / slideWidth);
    setActiveSlide(idx);
  }, []);

  const scrollToSlide = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.offsetWidth, behavior: "smooth" });
  }, []);

  function getDifficulty(c: Challenge): { label: string; color: string } {
    const delta = c.originalPosition - c.targetPosition;
    if (c.targetPosition === 1) {
      return {
        label: locale === "tr" ? "Zor" : "Hard",
        color: "text-f1-loss bg-f1-loss/10 border-f1-loss/30",
      };
    }
    if (delta >= 3) {
      return {
        label: locale === "tr" ? "Orta" : "Medium",
        color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
      };
    }
    return {
      label: locale === "tr" ? "Kolay" : "Easy",
      color: "text-f1-gain bg-f1-gain/10 border-f1-gain/30",
    };
  }

  if (view === "select") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="max-w-lg w-full text-center">
          <p className="f1-label text-f1-red mb-2">F1 WHAT-IF ENGINE</p>
          <h1 className="f1-heading text-2xl sm:text-3xl mb-6">
            {locale === "tr" ? "Bir Meydan Okuma Seç" : "Choose a Challenge"}
          </h1>

          <div className="relative">
            {CHALLENGES.length > 1 && activeSlide > 0 && (
              <button
                onClick={() => scrollToSlide(activeSlide - 1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 hidden sm:flex w-9 h-9 items-center justify-center rounded-full bg-f1-card border border-white/10 text-f1-grey hover:text-white hover:border-white/30 transition-colors"
              >
                ‹
              </button>
            )}
            {CHALLENGES.length > 1 && activeSlide < CHALLENGES.length - 1 && (
              <button
                onClick={() => scrollToSlide(activeSlide + 1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 hidden sm:flex w-9 h-9 items-center justify-center rounded-full bg-f1-card border border-white/10 text-f1-grey hover:text-white hover:border-white/30 transition-colors"
              >
                ›
              </button>
            )}

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide gap-4 pb-4 -mx-6 px-6"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {CHALLENGES.map((c) => {
                const texts = c.texts[locale] ?? c.texts.en;
                const cRaceData = getRaceDataForChallenge(c);
                const driver = cRaceData.drivers.find((d) => d.id === c.driverId);
                const difficulty = getDifficulty(c);
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectChallenge(c)}
                    className="snap-center shrink-0 w-[85vw] max-w-md f1-card text-left p-6 hover:border-f1-red/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="f1-label text-f1-red text-[10px]">
                        {cRaceData.race.name} {cRaceData.race.year}
                      </p>
                      <span className={`text-[10px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${difficulty.color}`}>
                        {difficulty.label}
                      </span>
                    </div>
                    <p className="f1-heading text-xl mb-2">{texts.title}</p>
                    <p className="text-f1-grey font-body text-sm mb-4">{texts.description}</p>
                    {driver && (
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          className="inline-block w-1.5 h-6 rounded-sm"
                          style={{ backgroundColor: driver.teamColor }}
                        />
                        <div>
                          <span className="font-body text-sm text-white block">{driver.name}</span>
                          <span className="text-f1-grey text-xs">{driver.team}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-[10px] text-f1-grey uppercase tracking-wider">
                            {locale === "tr" ? "Sıralama" : "Grid"}
                          </p>
                          <p className="f1-number text-2xl text-f1-grey">P{c.originalPosition}</p>
                        </div>
                        <span className="text-f1-red text-lg">→</span>
                        <div className="text-center">
                          <p className="text-[10px] text-f1-grey uppercase tracking-wider">
                            {locale === "tr" ? "Hedef" : "Target"}
                          </p>
                          <p className="f1-number text-2xl text-f1-gain">P{c.targetPosition}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-f1-grey uppercase tracking-wider mb-1">
                          {cRaceData.race.totalLaps} {locale === "tr" ? "tur" : "laps"}
                        </p>
                        <p className="text-f1-red text-xs font-body font-bold uppercase tracking-wider">
                          {locale === "tr" ? "Oyna →" : "Play →"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {CHALLENGES.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {CHALLENGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToSlide(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === activeSlide ? "bg-f1-red" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          )}
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
          onHome={handleBackToSelect}
        />
      ) : null;
  }
}
