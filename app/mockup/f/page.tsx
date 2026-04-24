import { notFound } from "next/navigation";
import { CivicBrief } from "./civic-brief";
import { loadBriefData } from "./loader";

export default function MockupF() {
  const d = loadBriefData("560034");
  if (!d) return notFound();
  return <CivicBrief d={d} />;
}
