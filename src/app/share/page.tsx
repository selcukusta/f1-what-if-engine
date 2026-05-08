import { Metadata } from "next";
import { getChallengeById, getRaceDataForChallenge, CHALLENGES } from "@/data/challenges";
import en from "@/i18n/en";
import tr from "@/i18n/tr";
import type { Translations } from "@/i18n/types";
import ShareContent from "./ShareContent";

const TRANSLATIONS: Record<string, Translations> = { en, tr };

type Props = {
  searchParams: Promise<{
    c?: string;
    d?: string;
    f?: string;
    t?: string;
    s?: string;
    st?: string;
    tier?: string;
    lang?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const from = params.f ?? "?";
  const to = params.t ?? "?";
  const t = TRANSLATIONS[params.lang ?? "en"] ?? en;

  const challenge = getChallengeById(params.c ?? "") ?? CHALLENGES[0];
  const raceData = getRaceDataForChallenge(challenge);
  const driver = raceData.drivers.find((d) => d.id === challenge.driverId);
  const driverName = driver?.name ?? "Driver";

  const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev";

  const ogParams = new URLSearchParams();
  if (params.c) ogParams.set("c", params.c);
  if (params.d) ogParams.set("d", params.d);
  if (params.f) ogParams.set("f", params.f);
  if (params.t) ogParams.set("t", params.t);
  if (params.s) ogParams.set("s", params.s);
  if (params.tier) ogParams.set("tier", params.tier);
  if (params.st) ogParams.set("st", params.st);
  ogParams.set("v", buildId);

  const title = `${t.result.shareTitle(driverName, Number(from), Number(to))} | F1 What-If Engine`;
  const description = t.result.shareText;

  return {
    title,
    description,
    openGraph: {
      title: t.result.shareTitle(driverName, Number(from), Number(to)),
      description: t.result.shareText,
      images: [`/api/og?${ogParams.toString()}`],
    },
    twitter: {
      card: "summary_large_image",
      title: t.result.shareTitle(driverName, Number(from), Number(to)),
      description: t.result.shareText,
      images: [`/api/og?${ogParams.toString()}`],
    },
  };
}

export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams;
  return <ShareContent params={params} />;
}
