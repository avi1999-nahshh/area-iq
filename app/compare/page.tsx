import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import { HeadToHead } from "./head-to-head";

interface Props {
  searchParams: Promise<{ a?: string; b?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { a: pincodeA = "560034", b: pincodeB = "400050" } = await searchParams;
  return {
    title: `Compare ${pincodeA} vs ${pincodeB} — AreaIQ Head-to-Head`,
    description: `Side-by-side comparison of ${pincodeA} and ${pincodeB} — safety, air quality, rent, transit, and more.`,
  };
}

export default async function ComparePage({ searchParams }: Props) {
  const { a: pincodeA = "560034", b: pincodeB = "400050" } = await searchParams;

  const [dataA, dataB] = await Promise.all([
    fetchQuery(api.area.getByPincode, { pincode: pincodeA }),
    fetchQuery(api.area.getByPincode, { pincode: pincodeB }),
  ]);

  // Fallback stub if pincode not found — HeadToHead handles gracefully
  const fallbackArea = (pincode: string) => ({
    pincode: { pincode, name: pincode, district: "—", state: "—" },
    scores: null,
    airQuality: null,
    safety: null,
    infrastructure: null,
    property: null,
    archetype: null,
    trivia: null,
  });

  const a = dataA ?? fallbackArea(pincodeA);
  const b = dataB ?? fallbackArea(pincodeB);

  return <HeadToHead a={a} b={b} />;
}
