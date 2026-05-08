"use client";

import { useI18n } from "@/i18n/context";

type Props = {
  from: number | string;
  to: number | string;
  positionsGained?: number;
};

export default function PositionHero({ from, to, positionsGained }: Props) {
  const { t } = useI18n();
  const gained = positionsGained ?? Number(from) - Number(to);
  const gainColor =
    gained > 0 ? "text-f1-gain" : gained < 0 ? "text-f1-loss" : "text-f1-grey";

  return (
    <>
      <div className="flex items-center justify-center gap-4 sm:gap-6 my-4 sm:my-8">
        <div>
          <p className="f1-label mb-1">{t.result.was}</p>
          <p className="f1-number text-3xl sm:text-5xl text-f1-grey">P{from}</p>
        </div>
        <div className="flex flex-col items-center">
          <span className={`text-2xl sm:text-3xl ${gainColor}`}>→</span>
          <p className={`font-body font-bold text-[10px] sm:text-xs ${gainColor} mt-1`}>
            {gained > 0
              ? t.result.positionsGained(gained)
              : gained < 0
                ? t.result.positionsLost(gained)
                : t.result.noChange}
          </p>
        </div>
        <div>
          <p className="f1-label mb-1">{t.result.now}</p>
          <p className={`f1-number text-3xl sm:text-5xl ${gainColor}`}>P{to}</p>
        </div>
      </div>
    </>
  );
}
