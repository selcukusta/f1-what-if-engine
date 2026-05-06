"use client";

import { Compound } from "@/engine/types";
import { TIRE_COLORS } from "@/engine/constants";

type TireBarStint = {
  compound: Compound;
  startLap: number;
  endLap: number;
};

type Props = {
  stints: TireBarStint[];
  totalLaps: number;
};

export default function TireBar({ stints, totalLaps }: Props) {
  return (
    <div>
      <div className="flex h-10 rounded-md overflow-hidden">
        {stints.map((stint, i) => {
          const width =
            ((stint.endLap - stint.startLap + 1) / totalLaps) * 100;
          return (
            <div
              key={i}
              className="flex items-center justify-center text-xs font-body font-bold"
              style={{
                width: `${width}%`,
                backgroundColor: TIRE_COLORS[stint.compound],
                color: stint.compound === "hard" ? "#000" : "#fff",
                borderRight:
                  i < stints.length - 1 ? "2px solid #15151E" : "none",
              }}
            >
              {stint.compound[0].toUpperCase()} (L{stint.startLap}-
              {stint.endLap})
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-f1-grey">Lap 1</span>
        <span className="text-[10px] text-f1-grey">Lap {totalLaps}</span>
      </div>
    </div>
  );
}
