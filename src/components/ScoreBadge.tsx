"use client";

import { useI18n } from "@/i18n/context";

type Props = {
  tier: string;
};

export default function ScoreBadge({ tier }: Props) {
  const { t } = useI18n();
  const label = t.tiers[tier] ?? tier;

  return (
    <div className="text-f1-gold text-xs font-body font-semibold uppercase tracking-[3px]">
      ★ {label} ★
    </div>
  );
}
