"use client";

import { Challenge, RaceData } from "@/engine/types";
import { useI18n } from "@/i18n/context";

type Props = {
  challenge: Challenge;
  raceData: RaceData;
  onAccept: () => void;
};

export default function ChallengeBrief({
  challenge,
  raceData,
  onAccept,
}: Props) {
  const { t } = useI18n();
  const driver = raceData.drivers.find((d) => d.id === challenge.driverId);
  if (!driver) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="max-w-md w-full text-center">
        <p className="f1-label text-f1-red mb-4">
          {raceData.race.name} {raceData.race.year}
        </p>

        <h1 className="f1-heading text-3xl mb-2">{t.challenge.title}</h1>

        <div className="my-8">
          <div className="f1-card inline-block px-8 py-6">
            <div
              className="text-sm font-body font-bold uppercase tracking-wider mb-1"
              style={{ color: driver.teamColor }}
            >
              {driver.team}
            </div>
            <div className="f1-heading text-2xl">{driver.name}</div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div>
                <div className="f1-label mb-1">{t.challenge.grid}</div>
                <div className="f1-number text-4xl text-f1-grey">
                  P{challenge.originalPosition}
                </div>
              </div>
              <div className="text-f1-red text-2xl">→</div>
              <div>
                <div className="f1-label mb-1">{t.challenge.target}</div>
                <div className="f1-number text-4xl text-f1-gain">
                  P{challenge.targetPosition}
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-f1-grey font-body text-base mb-8 max-w-sm mx-auto">
          {t.challenge.description}
        </p>

        <div className="space-y-3 text-sm text-f1-grey font-body mb-10">
          <p>
            {t.challenge.maxPitStops(challenge.maxPitStops)} ·{" "}
            {t.challenge.laps(raceData.race.totalLaps)} · {t.challenge.mustUseCompounds}
          </p>
        </div>

        <button onClick={onAccept} className="f1-button w-full max-w-xs">
          {t.challenge.acceptButton}
        </button>
      </div>
    </div>
  );
}
