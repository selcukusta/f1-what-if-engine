"use client";

import { useState, useMemo } from "react";
import {
  Challenge,
  Compound,
  RaceData,
  UserStrategy,
} from "@/engine/types";
import { TIRE_CONFIG, TIRE_COLORS } from "@/engine/constants";
import { validateStrategy } from "@/engine/validate";
import { useI18n } from "@/i18n/context";
import TireBar from "./TireBar";

type Props = {
  challenge: Challenge;
  raceData: RaceData;
  initialStrategy?: UserStrategy | null;
  onSimulate: (strategy: UserStrategy) => void;
  onReset?: () => void;
};

const COMPOUNDS: Compound[] = ["soft", "medium", "hard"];

export default function StrategyBuilder({
  challenge,
  raceData,
  initialStrategy,
  onSimulate,
  onReset,
}: Props) {
  const { locale, t } = useI18n();
  const { totalLaps } = raceData.race;
  const [startCompound, setStartCompound] = useState<Compound>(
    initialStrategy?.compounds[0] ?? "soft"
  );
  const [pit1Lap, setPit1Lap] = useState(
    initialStrategy?.pitLaps[0] ?? 20
  );
  const [pit1Compound, setPit1Compound] = useState<Compound>(
    initialStrategy?.compounds[1] ?? "hard"
  );
  const [hasPit2, setHasPit2] = useState(
    (initialStrategy?.pitLaps.length ?? 0) >= 2
  );
  const [pit2Lap, setPit2Lap] = useState(
    initialStrategy?.pitLaps[1] ?? 50
  );
  const [pit2Compound, setPit2Compound] = useState<Compound>(
    initialStrategy?.compounds[2] ?? "medium"
  );

  const strategy = useMemo<UserStrategy>(() => {
    if (hasPit2) {
      return {
        pitLaps: [pit1Lap, pit2Lap],
        compounds: [startCompound, pit1Compound, pit2Compound],
      };
    }
    return {
      pitLaps: [pit1Lap],
      compounds: [startCompound, pit1Compound],
    };
  }, [startCompound, pit1Lap, pit1Compound, hasPit2, pit2Lap, pit2Compound]);

  function resetToDefaults() {
    setStartCompound("soft");
    setPit1Lap(20);
    setPit1Compound("hard");
    setHasPit2(false);
    setPit2Lap(50);
    setPit2Compound("medium");
    onReset?.();
  }

  const isModified = initialStrategy != null;

  const errors = useMemo(
    () => validateStrategy(strategy, challenge, totalLaps, t),
    [strategy, challenge, totalLaps, t]
  );

  const stints = useMemo(() => {
    const result = [];
    let start = 1;
    for (let i = 0; i < strategy.compounds.length; i++) {
      const end =
        i < strategy.pitLaps.length ? strategy.pitLaps[i] : totalLaps;
      result.push({
        startLap: start,
        endLap: end,
        compound: strategy.compounds[i],
      });
      start = end + 1;
    }
    return result;
  }, [strategy, totalLaps]);

  const driver = raceData.drivers.find((d) => d.id === challenge.driverId);

  function clampLap(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="f1-label text-f1-red mb-1">
              {(challenge.texts[locale] ?? challenge.texts.en).title}
            </p>
            <p className="f1-heading text-lg">
              {driver?.name} — P{challenge.originalPosition} → P
              {challenge.targetPosition}
            </p>
          </div>
          <p className="text-f1-grey text-sm font-body">
            {t.challenge.laps(totalLaps)}
          </p>
        </div>

        <div className="mb-6">
          <p className="f1-label mb-3">{t.strategy.raceTimeline}</p>
          <TireBar stints={stints} totalLaps={totalLaps} />
        </div>

        <div className="f1-card mb-4">
          <p className="f1-label mb-3">{t.strategy.tireData}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {COMPOUNDS.map((c) => {
              const tire = TIRE_CONFIG[c];
              return (
                <div
                  key={c}
                  className="rounded-md py-2 px-1"
                  style={{
                    backgroundColor: `${TIRE_COLORS[c]}15`,
                    borderTop: `2px solid ${TIRE_COLORS[c]}`,
                  }}
                >
                  <div
                    className="text-xs font-body font-bold uppercase mb-1"
                    style={{ color: TIRE_COLORS[c] }}
                  >
                    {tire.label}
                  </div>
                  <div className="text-[10px] text-f1-grey font-body leading-relaxed">
                    <div>
                      <span className="text-white">{tire.effect > 0 ? "+" : ""}{tire.effect}s</span> {t.strategy.pace}
                    </div>
                    <div>
                      <span className="text-white">+{tire.degradationPerLap}s</span>{t.strategy.lapDeg}
                    </div>
                    <div>
                      <span className="text-white">{tire.lifetime}</span> {t.strategy.lapLife}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-f1-grey/60 font-body mt-2 text-center">
            {t.strategy.tireLifeWarning(raceData.race.pitLossSec)}
          </p>
        </div>

        <div className="f1-card mb-4">
          <p className="f1-label mb-3">{t.strategy.startingTire}</p>
          <div className="flex gap-2">
            {COMPOUNDS.map((c) => (
              <button
                key={c}
                onClick={() => setStartCompound(c)}
                className={`flex-1 py-2 rounded-md font-body font-bold text-sm uppercase transition-opacity ${
                  startCompound === c
                    ? "ring-2 ring-white"
                    : "opacity-40"
                }`}
                style={{
                  backgroundColor: TIRE_COLORS[c],
                  color: c === "hard" ? "#000" : "#fff",
                }}
              >
                {TIRE_CONFIG[c].label}
              </button>
            ))}
          </div>
        </div>

        <div className="f1-card mb-4">
          <p className="f1-label mb-3">{t.strategy.pitStop(1)}</p>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm text-f1-grey font-body">{t.strategy.lap}:</span>
            <button
              onClick={() => setPit1Lap((l) => clampLap(l - 1, 2, totalLaps - 5))}
              className="w-8 h-8 rounded bg-f1-bg text-white font-body font-bold"
            >
              −
            </button>
            <span className="f1-number text-xl w-10 text-center">
              {pit1Lap}
            </span>
            <button
              onClick={() => setPit1Lap((l) => clampLap(l + 1, 2, totalLaps - 5))}
              className="w-8 h-8 rounded bg-f1-bg text-white font-body font-bold"
            >
              +
            </button>
          </div>
          <p className="f1-label mb-2">{t.strategy.nextTire}</p>
          <div className="flex gap-2">
            {COMPOUNDS.map((c) => (
              <button
                key={c}
                onClick={() => setPit1Compound(c)}
                className={`flex-1 py-2 rounded-md font-body font-bold text-sm uppercase transition-opacity ${
                  pit1Compound === c
                    ? "ring-2 ring-white"
                    : "opacity-40"
                }`}
                style={{
                  backgroundColor: TIRE_COLORS[c],
                  color: c === "hard" ? "#000" : "#fff",
                }}
              >
                {TIRE_CONFIG[c].label}
              </button>
            ))}
          </div>
        </div>

        {challenge.maxPitStops >= 2 && (
          <div className="f1-card mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="f1-label">{t.strategy.pitStop(2)}</p>
              <button
                onClick={() => setHasPit2(!hasPit2)}
                className={`text-xs font-body font-bold uppercase tracking-wider px-3 py-1 rounded ${
                  hasPit2
                    ? "bg-f1-red text-white"
                    : "bg-f1-bg text-f1-grey"
                }`}
              >
                {hasPit2 ? t.strategy.enabled : t.strategy.addStop}
              </button>
            </div>
            {hasPit2 && (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-sm text-f1-grey font-body">
                    {t.strategy.lap}:
                  </span>
                  <button
                    onClick={() =>
                      setPit2Lap((l) => clampLap(l - 1, pit1Lap + 5, totalLaps - 5))
                    }
                    className="w-8 h-8 rounded bg-f1-bg text-white font-body font-bold"
                  >
                    −
                  </button>
                  <span className="f1-number text-xl w-10 text-center">
                    {pit2Lap}
                  </span>
                  <button
                    onClick={() =>
                      setPit2Lap((l) => clampLap(l + 1, pit1Lap + 5, totalLaps - 5))
                    }
                    className="w-8 h-8 rounded bg-f1-bg text-white font-body font-bold"
                  >
                    +
                  </button>
                </div>
                <p className="f1-label mb-2">{t.strategy.nextTire}</p>
                <div className="flex gap-2">
                  {COMPOUNDS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setPit2Compound(c)}
                      className={`flex-1 py-2 rounded-md font-body font-bold text-sm uppercase transition-opacity ${
                        pit2Compound === c
                          ? "ring-2 ring-white"
                          : "opacity-40"
                      }`}
                      style={{
                        backgroundColor: TIRE_COLORS[c],
                        color: c === "hard" ? "#000" : "#fff",
                      }}
                    >
                      {TIRE_CONFIG[c].label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-f1-loss/10 border border-f1-loss/30">
            {errors.map((e, i) => (
              <p key={i} className="text-f1-loss text-sm font-body">
                {e.message}
              </p>
            ))}
          </div>
        )}

        <button
          onClick={() => errors.length === 0 && onSimulate(strategy)}
          disabled={errors.length > 0}
          className={`f1-button w-full ${
            errors.length > 0 ? "opacity-40 cursor-not-allowed" : ""
          }`}
        >
          {t.strategy.simulateButton}
        </button>
        {isModified && (
          <button
            onClick={resetToDefaults}
            className="mt-2 w-full text-f1-grey text-xs font-body font-bold uppercase tracking-wider hover:text-white transition-colors"
          >
            {t.strategy.resetButton}
          </button>
        )}
      </div>
    </div>
  );
}
