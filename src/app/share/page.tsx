import { Metadata } from "next";
import { getChallengeById, getRaceDataForChallenge, CHALLENGES } from "@/data/challenges";
import ShareContent from "./ShareContent";

type Props = {
  searchParams: Promise<{
    c?: string;
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

  const challenge = getChallengeById(params.c ?? "") ?? CHALLENGES[0];
  const raceData = getRaceDataForChallenge(challenge);
  const driver = raceData.drivers.find((d) => d.id === challenge.driverId);
  const driverName = driver?.name ?? "Driver";

  const ogParams = new URLSearchParams();
  if (params.c) ogParams.set("c", params.c);
  if (params.d) ogParams.set("d", params.d);
  if (params.f) ogParams.set("f", params.f);
  if (params.t) ogParams.set("t", params.t);
  if (params.s) ogParams.set("s", params.s);
  if (params.tier) ogParams.set("tier", params.tier);
  if (params.st) ogParams.set("st", params.st);

  const title = `I got ${driverName} from P${from} to P${to}! | F1 What-If Engine`;
  const description = "Can you beat my strategy? Change pit stops, change the race.";

  return {
    title,
    description,
    openGraph: {
      title: `I got ${driverName} from P${from} to P${to}!`,
      description: "Can you beat my strategy? F1 What-If Engine",
      images: [`/api/og?${ogParams.toString()}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `I got ${driverName} from P${from} to P${to}!`,
      description: "Can you beat my strategy? F1 What-If Engine",
      images: [`/api/og?${ogParams.toString()}`],
    },
  };
}

export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams;
  return <ShareContent params={params} />;
}
