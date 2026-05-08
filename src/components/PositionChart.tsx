"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Compound, RaceData } from "@/engine/types";
import { TIRE_COLORS } from "@/engine/constants";
import { useI18n } from "@/i18n/context";

type Props = {
  allPositionsPerLap: { driverId: string; positions: number[] }[];
  challengeDriverId: string;
  raceData: RaceData;
  pitLaps: number[];
  compounds: Compound[];
};

const MAX_SELECTED = 10;
const DOT_R = 7;

const COMPOUND_LABEL: Record<Compound, string> = {
  soft: "S",
  medium: "M",
  hard: "H",
};

type PitInfo = { compound: Compound };

function TireDot({ cx, cy, compound }: { cx: number; cy: number; compound: Compound }) {
  const color = TIRE_COLORS[compound];
  return (
    <g>
      <circle cx={cx} cy={cy} r={DOT_R} fill="#1a1a2e" stroke={color} strokeWidth={2} />
      <text
        x={cx}
        y={cy + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={8}
        fontWeight="bold"
      >
        {COMPOUND_LABEL[compound]}
      </text>
    </g>
  );
}

function buildPitMap(
  raceData: RaceData,
  challengeDriverId: string,
  pitLaps: number[],
  compounds: Compound[]
): Map<string, Map<number, PitInfo>> {
  const result = new Map<string, Map<number, PitInfo>>();

  for (const driver of raceData.drivers) {
    if (driver.dnf) continue;
    const map = new Map<number, PitInfo>();
    if (driver.id === challengeDriverId) {
      map.set(1, { compound: compounds[0] });
      for (let i = 0; i < pitLaps.length; i++) {
        map.set(pitLaps[i], { compound: compounds[i + 1] });
      }
    } else {
      const stints = driver.defaultStrategy;
      map.set(1, { compound: stints[0].compound as Compound });
      for (let i = 0; i < stints.length - 1; i++) {
        map.set(stints[i].endLap, { compound: stints[i + 1].compound as Compound });
      }
    }
    result.set(driver.id, map);
  }
  return result;
}

export default function PositionChart({
  allPositionsPerLap,
  challengeDriverId,
  raceData,
  pitLaps,
  compounds,
}: Props) {
  const { t } = useI18n();
  const driverMap = new Map(raceData.drivers.map((d) => [d.id, d]));
  const pitMap = buildPitMap(raceData, challengeDriverId, pitLaps, compounds);

  const sortedByFinish = allPositionsPerLap
    .filter((d) => d.driverId !== challengeDriverId)
    .sort((a, b) => {
      const aFinal = a.positions[a.positions.length - 1] ?? 20;
      const bFinal = b.positions[b.positions.length - 1] ?? 20;
      return aFinal - bFinal;
    });

  const challengeFinal = allPositionsPerLap
    .find((d) => d.driverId === challengeDriverId)
    ?.positions.at(-1) ?? 20;
  const challengeInTop3 = challengeFinal <= 3;
  const initialOthers = sortedByFinish
    .slice(0, challengeInTop3 ? 2 : 2)
    .map((d) => d.driverId);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set([challengeDriverId, ...initialOthers])
  );

  function toggleDriver(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (id === challengeDriverId) return next;
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_SELECTED) {
        next.add(id);
      }
      return next;
    });
  }

  const totalLaps = allPositionsPerLap[0]?.positions.length ?? 0;
  const step = totalLaps > 40 ? 5 : totalLaps > 20 ? 2 : 1;

  const allPitLaps = new Set<number>();
  for (const [, pits] of pitMap) {
    for (const lap of pits.keys()) allPitLaps.add(lap);
  }

  const sampledIndices = new Set<number>();
  for (let i = 0; i < totalLaps; i += step) {
    sampledIndices.add(i);
  }
  if (totalLaps > 0) sampledIndices.add(totalLaps - 1);
  for (const pl of allPitLaps) {
    if (pl - 1 >= 0 && pl - 1 < totalLaps) sampledIndices.add(pl - 1);
  }
  const sortedIndices = [...sampledIndices].sort((a, b) => a - b);

  const data = sortedIndices.map((i) => {
    const point: Record<string, number> = { lap: i + 1 };
    for (const dp of allPositionsPerLap) {
      if (selected.has(dp.driverId)) {
        point[dp.driverId] = dp.positions[i];
      }
    }
    return point;
  });

  const [visibleCount, setVisibleCount] = useState(1);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setVisibleCount(1);
    const total = data.length;
    if (total <= 1) return;
    const duration = Math.ceil(totalLaps / 10) * 1000;
    let start: number | null = null;

    function tick(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      const count = Math.max(1, Math.round(eased * total));
      setVisibleCount(count);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [data.length]);

  const animating = visibleCount < data.length;
  const visibleData = data.slice(0, visibleCount);
  const currentLap = visibleData[visibleData.length - 1]?.lap ?? 1;

  const selectedDrivers = allPositionsPerLap.filter((d) =>
    selected.has(d.driverId)
  );

  const makeDotRenderer = useCallback(
    (driverId: string) => {
      const pits = pitMap.get(driverId);
      return (props: { cx?: number; cy?: number; payload?: Record<string, number> }) => {
        const { cx, cy, payload } = props;
        if (cx == null || cy == null || !payload) return null;
        const info = pits?.get(payload.lap);
        if (info) {
          return <TireDot cx={cx} cy={cy} compound={info.compound} />;
        }
        return null;
      };
    },
    [pitMap]
  );

  return (
    <div className="f1-card mb-6 text-left">
      <p className="f1-label mb-3">{t.chart.title}</p>

      <div className="w-full h-56 relative">
        {animating && (
          <div className="absolute top-1 right-2 z-10 f1-number text-lg text-white/20">
            L{currentLap}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visibleData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="lap"
              tick={{ fontSize: 9, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#333" }}
              domain={[1, data[data.length - 1]?.lap ?? totalLaps]}
              interval={data.length > 12 ? Math.floor(data.length / 8) : 0}
              label={{ value: "Lap", position: "insideBottomRight", offset: -4, fontSize: 9, fill: "#6b7280" }}
            />
            <YAxis
              reversed
              domain={[1, 20]}
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#333" }}
              label={{ value: t.chart.position, angle: -90, position: "insideLeft", offset: 30, fontSize: 10, fill: "#6b7280" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              labelFormatter={(lap) => `Lap ${lap}`}
              formatter={(value: unknown, name: unknown) => {
                const driver = driverMap.get(String(name));
                return [`P${value}`, driver?.name ?? String(name)];
              }}
            />
            {selectedDrivers.map((dp) => {
              const driver = driverMap.get(dp.driverId);
              const isChallenge = dp.driverId === challengeDriverId;
              const color = driver?.teamColor ?? "#666";
              return (
                <Line
                  key={dp.driverId}
                  type="monotone"
                  dataKey={dp.driverId}
                  stroke={color}
                  strokeWidth={isChallenge ? 3 : 1.5}
                  dot={makeDotRenderer(dp.driverId)}
                  activeDot={{ r: 4 }}
                  strokeDasharray={isChallenge ? undefined : "4 2"}
                  opacity={isChallenge ? 1 : 0.7}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {allPositionsPerLap.map((dp) => {
          const driver = driverMap.get(dp.driverId);
          if (!driver) return null;
          const isSelected = selected.has(dp.driverId);
          const isChallenge = dp.driverId === challengeDriverId;
          const canSelect = isSelected || selected.size < MAX_SELECTED;

          return (
            <button
              key={dp.driverId}
              onClick={() => toggleDriver(dp.driverId)}
              disabled={isChallenge}
              className={`text-[10px] font-body font-bold px-2 py-0.5 rounded-full transition-opacity ${
                isChallenge
                  ? "ring-1 ring-white"
                  : isSelected
                    ? "opacity-100"
                    : canSelect
                      ? "opacity-30 hover:opacity-50"
                      : "opacity-15 cursor-not-allowed"
              }`}
              style={{
                backgroundColor: isSelected ? driver.teamColor : "#333",
                color: isSelected ? "#fff" : "#888",
              }}
            >
              {driver.id}
            </button>
          );
        })}
      </div>
      <p className="text-[9px] text-f1-grey/60 font-body mt-2 text-center">
        {t.chart.selectDrivers(MAX_SELECTED)} ·
        <span className="inline-flex items-center gap-1 ml-1">
          <svg width="12" height="12" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" fill="#1a1a2e" stroke="#DA291C" strokeWidth="1.5"/><text x="7" y="7.5" textAnchor="middle" dominantBaseline="central" fill="#DA291C" fontSize="7" fontWeight="bold">S</text></svg>
          <svg width="12" height="12" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" fill="#1a1a2e" stroke="#FFD700" strokeWidth="1.5"/><text x="7" y="7.5" textAnchor="middle" dominantBaseline="central" fill="#FFD700" fontSize="7" fontWeight="bold">M</text></svg>
          <svg width="12" height="12" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" fill="#1a1a2e" stroke="#FFFFFF" strokeWidth="1.5"/><text x="7" y="7.5" textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" fontSize="7" fontWeight="bold">H</text></svg>
          = {t.chart.tireChange}
        </span>
      </p>
    </div>
  );
}
