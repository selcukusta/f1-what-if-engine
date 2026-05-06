import { Metadata } from "next";
import ShareContent from "./ShareContent";

type Props = {
  searchParams: Promise<{
    d?: string;
    f?: string;
    t?: string;
    s?: string;
    st?: string;
    tier?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const from = params.f ?? "?";
  const to = params.t ?? "?";

  const ogParams = new URLSearchParams();
  if (params.d) ogParams.set("d", params.d);
  if (params.f) ogParams.set("f", params.f);
  if (params.t) ogParams.set("t", params.t);
  if (params.s) ogParams.set("s", params.s);
  if (params.tier) ogParams.set("tier", params.tier);
  if (params.st) ogParams.set("st", params.st);

  return {
    title: `I got Verstappen from P${from} to P${to}! | F1 What-If Engine`,
    description: "Can you beat my strategy? Change pit stops, change the race.",
    openGraph: {
      title: `I got Verstappen from P${from} to P${to}!`,
      description: "Can you beat my strategy? F1 What-If Engine",
      images: [`/api/og?${ogParams.toString()}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `I got Verstappen from P${from} to P${to}!`,
      description: "Can you beat my strategy? F1 What-If Engine",
      images: [`/api/og?${ogParams.toString()}`],
    },
  };
}

export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams;
  return <ShareContent params={params} />;
}
