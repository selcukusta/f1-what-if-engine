"use client";

import { useState } from "react";
import { ACTUAL_RACE_ORDER } from "@/engine/constants";
import { RaceData } from "@/engine/types";
import { useI18n } from "@/i18n/context";

type Props = {
  allDriverResults: { driverId: string; finalPosition: number }[];
  challengeDriverId: string;
  raceData: RaceData;
};

export default function StandingsComparison({
  allDriverResults,
  challengeDriverId,
  raceData,
}: Props) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const displayCount = expanded ? 20 : 10;

  const simOrder = [...allDriverResults].sort(
    (a, b) => a.finalPosition - b.finalPosition
  );

  const actualMap = new Map(
    ACTUAL_RACE_ORDER.map((d, i) => [d.id, i + 1])
  );

  const rows = Array.from({ length: displayCount }, (_, i) => {
    const pos = i + 1;

    const actualDriver = ACTUAL_RACE_ORDER[i];

    const simEntry = simOrder.find((d) => d.finalPosition === pos);
    const simDriverId = simEntry?.driverId ?? "";
    const simDriverData = raceData.drivers.find((d) => d.id === simDriverId);

    const actualPosOfSimDriver = actualMap.get(simDriverId) ?? 0;
    const delta = actualPosOfSimDriver - pos;

    return {
      pos,
      actualId: actualDriver?.id ?? "",
      actualName: actualDriver?.name ?? "",
      actualTeamColor: actualDriver?.teamColor ?? "#fff",
      simId: simDriverId,
      simName: simDriverData?.name ?? "",
      simTeamColor: simDriverData?.teamColor ?? "#fff",
      delta,
    };
  });

  return (
    <div className="f1-card text-left mb-4">
      <p className="f1-label mb-3">{t.standings.title}</p>

      <div className="overflow-hidden rounded-md">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="text-f1-grey text-[10px] uppercase tracking-wider">
              <th className="text-left py-2 px-2 w-8">P</th>
              <th className="text-left py-2 px-2">{t.standings.actualRace}</th>
              <th className="text-left py-2 px-2">{t.standings.yourSimulation}</th>
              <th className="text-right py-2 px-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isChallenge = row.simId === challengeDriverId;
              return (
                <tr
                  key={row.pos}
                  className={`border-t border-white/5 ${
                    isChallenge ? "bg-team-red-bull/10" : ""
                  }`}
                >
                  <td className="py-2 px-2 f1-number text-f1-grey text-xs">
                    {row.pos}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className="inline-block w-1 h-4 rounded-sm mr-2 align-middle"
                      style={{ backgroundColor: row.actualTeamColor }}
                    />
                    <span
                      className={`text-xs align-middle ${
                        row.actualId === challengeDriverId
                          ? "text-white font-bold"
                          : "text-f1-grey"
                      }`}
                    >
                      {row.actualName}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className="inline-block w-1 h-4 rounded-sm mr-2 align-middle"
                      style={{ backgroundColor: row.simTeamColor }}
                    />
                    <span
                      className={`text-xs align-middle ${
                        isChallenge ? "text-white font-bold" : "text-f1-grey"
                      }`}
                    >
                      {row.simName}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    {row.delta !== 0 && (
                      <span
                        className={`text-[10px] font-bold ${
                          row.delta > 0 ? "text-f1-gain" : "text-f1-loss"
                        }`}
                      >
                        {row.delta > 0 ? `↑${row.delta}` : `↓${Math.abs(row.delta)}`}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full mt-3 py-2 text-center text-f1-grey text-xs font-body font-bold uppercase tracking-wider hover:text-white transition-colors"
        >
          {t.standings.fullClassification}
        </button>
      )}
    </div>
  );
}
