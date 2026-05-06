type Props = {
  tier: string;
};

export default function ScoreBadge({ tier }: Props) {
  return (
    <div className="text-f1-gold text-xs font-body font-semibold uppercase tracking-[3px]">
      ★ {tier} ★
    </div>
  );
}
