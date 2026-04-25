import { redirect } from "next/navigation";
import { defaultPairSlug, pincodeToSlug } from "./lib";

interface Props {
  searchParams: Promise<{ a?: string; b?: string }>;
}

/**
 * Root /compare. Two responsibilities:
 *  - Redirect to the default pair (`indiranagar-vs-koramangala`) when no
 *    params are given, so the empty state is itself a shareable URL.
 *  - Honour legacy `/compare?a=560034&b=400050` shared links by
 *    301-equivalent redirecting to the slug form.
 */
export default async function CompareRoot({ searchParams }: Props) {
  const { a, b } = await searchParams;
  if (a && b) {
    const slugA = pincodeToSlug(a);
    const slugB = pincodeToSlug(b);
    redirect(`/compare/${slugA}-vs-${slugB}`);
  }
  redirect(`/compare/${defaultPairSlug()}`);
}
