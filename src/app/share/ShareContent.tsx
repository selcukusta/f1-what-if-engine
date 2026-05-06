"use client";

import { useMemo } from "react";
import Link from "next/link";
import raceDataJson from "@/data/race-data.json";
import { MONACO_2024_CHALLENGE } from "@/data/challenges";
import { RaceData, Compound, UserStrategy } from "@/engine/types";
import { simulateRace } from "@/engine/simulate";
import ScoreBadge from "@/components/ScoreBadge";
import StandingsComparison from "@/components/StandingsComparison";

const raceData = raceDataJson as RaceData;
const challenge = MONACO_2024_CHALLENGE;

type Props = {
  params: {
    d?: string;
    f?: string;
    t?: string;
    s?: string;
    st?: string;
    tier?: string;
  };
};

function parseStrategy(st: string, totalLaps: number): UserStrategy | null {
  const parts = st.split("-");
  if (parts.length < 2) return null;

  const compoundMap: Record<string, Compound> = {
    S: "soft",
    M: "medium",
    H: "hard",
  };

  const compounds: Compound[] = [];
  const pitLaps: number[] = [];

  for (let i = 0; i < parts.length; i++) {
    const letter = parts[i][0];
    const lap = parseInt(parts[i].slice(1));
    const compound = compoundMap[letter];
    if (!compound || isNaN(lap)) return null;
    compounds.push(compound);
    if (i < parts.length - 1) {
      pitLaps.push(lap);
    }
  }

  return { pitLaps, compounds };
}

export default function ShareContent({ params }: Props) {
  const from = params.f ?? "?";
  const to = params.t ?? "?";
  const score = params.s ?? "0";
  const tier = params.tier ?? "Unknown";
  const positionsGained = Number(from) - Number(to);

  const simOutput = useMemo(() => {
    if (!params.st) return null;
    const strategy = parseStrategy(params.st, raceData.race.totalLaps);
    if (!strategy) return null;
    return simulateRace(raceData, challenge.driverId, strategy);
  }, [params.st]);

  const gainColor =
    positionsGained > 0
      ? "text-f1-gain"
      : positionsGained < 0
        ? "text-f1-loss"
        : "text-f1-grey";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="max-w-md w-full text-center">
        <p className="f1-label text-f1-red mb-4">F1 What-If Engine</p>

        <ScoreBadge tier={tier} />

        <div className="flex items-center justify-center gap-6 my-8">
          <div>
            <p className="f1-label mb-1">Was</p>
            <p className="f1-number text-5xl text-f1-grey">P{from}</p>
          </div>
          <div className={`text-3xl ${gainColor}`}>→</div>
          <div>
            <p className="f1-label mb-1">Now</p>
            <p className={`f1-number text-5xl ${gainColor}`}>P{to}</p>
          </div>
        </div>

        <p className="f1-heading text-lg mb-2">Max Verstappen</p>
        <p className="text-f1-grey text-sm font-body mb-4">
          Monaco Grand Prix 2024
        </p>

        <div className="mb-6">
          <p className="f1-label mb-1">Score</p>
          <p className="f1-number text-4xl">{score}</p>
        </div>

        {simOutput && (
          <StandingsComparison
            allDriverResults={simOutput.allDriverResults}
            challengeDriverId={challenge.driverId}
            raceData={raceData}
          />
        )}

        <Link href="/" className="f1-button inline-block mt-4">
          Can you beat this? →
        </Link>
      </div>
    </div>
  );
}
