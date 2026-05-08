"use client";

import { useState, useMemo } from "react";
import { RaceData } from "@/engine/types";
import { useI18n } from "@/i18n/context";

type Props = {
  allDriverResults: { driverId: string; finalPosition: number }[];
  allPositionsPerLap?: { driverId: string; positions: number[] }[];
  challengeDriverId: string;
  raceData: RaceData;
  currentLap?: number;
};

export default function StandingsComparison({
  allDriverResults,
  allPositionsPerLap,
  challengeDriverId,
  raceData,
  currentLap,
}: Props) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const driverMap = useMemo(
    () => new Map(raceData.drivers.map((d) => [d.id, d])),
    [raceData],
  );

  const dnfIds = useMemo(
    () => new Set(raceData.drivers.filter((d) => d.dnf).map((d) => d.id)),
    [raceData],
  );

  const actualOrderDrivers = useMemo(() => {
    if (raceData.actualOrder) {
      return raceData.actualOrder
        .map((id) => driverMap.get(id)!)
        .filter(Boolean);
    }
    return [...raceData.drivers].sort((a, b) => a.gridPosition - b.gridPosition);
  }, [raceData, driverMap]);

  const liveResults = useMemo(() => {
    if (!allPositionsPerLap || currentLap == null) return allDriverResults;
    const lapIdx = Math.min(currentLap - 1, (allPositionsPerLap[0]?.positions.length ?? 1) - 1);
    return allPositionsPerLap.map((dp) => ({
      driverId: dp.driverId,
      finalPosition: dp.positions[lapIdx] ?? 20,
    }));
  }, [allDriverResults, allPositionsPerLap, currentLap]);

  const { simByPosition, actualMap, finisherCount } = useMemo(() => {
    const posMap = new Map<number, { driverId: string; finalPosition: number }>();
    for (const entry of liveResults) {
      posMap.set(entry.finalPosition, entry);
    }
    const aMap = new Map<string, number>();
    let fCount = 0;
    for (let i = 0; i < actualOrderDrivers.length; i++) {
      const d = actualOrderDrivers[i];
      if (!dnfIds.has(d.id)) {
        fCount++;
        aMap.set(d.id, fCount);
      }
    }
    return { simByPosition: posMap, actualMap: aMap, finisherCount: fCount };
  }, [liveResults, actualOrderDrivers, dnfIds]);

  const driverCount = actualOrderDrivers.length;
  const displayCount = expanded ? driverCount : Math.min(10, driverCount);

  const rows = Array.from({ length: displayCount }, (_, i) => {
    const pos = i + 1;
    const actualDriver = actualOrderDrivers[i];
    const isDnf = dnfIds.has(actualDriver?.id ?? "");

    const simEntry = pos <= finisherCount ? simByPosition.get(pos) : undefined;
    const simDriverId = simEntry?.driverId ?? "";
    const simDriverData = driverMap.get(simDriverId);

    const actualPosOfSimDriver = actualMap.get(simDriverId) ?? 0;
    const delta = !isDnf && simDriverId ? actualPosOfSimDriver - pos : 0;

    return {
      pos,
      actualId: actualDriver?.id ?? "",
      actualName: actualDriver?.name ?? "",
      actualTeamColor: actualDriver?.teamColor ?? "#fff",
      isDnf,
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
                    {row.isDnf ? "DNF" : row.pos}
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
                          : row.isDnf
                          ? "text-f1-grey/50"
                          : "text-f1-grey"
                      }`}
                    >
                      {row.actualName}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    {row.isDnf ? (
                      <span className="text-xs text-f1-grey/50">DNF</span>
                    ) : (
                      <>
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
                      </>
                    )}
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
