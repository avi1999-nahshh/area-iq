import { notFound } from "next/navigation";
import { CivicBrief } from "../civic-brief";
import { loadBriefData } from "../loader";

export default async function MockupFPincode({
  params,
}: {
  params: Promise<{ pincode: string }>;
}) {
  const { pincode } = await params;
  const d = loadBriefData(pincode);
  if (!d) return notFound();
  return <CivicBrief d={d} />;
}
