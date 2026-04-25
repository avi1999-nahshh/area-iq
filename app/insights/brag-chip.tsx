import type { ReactNode } from "react";

/**
 * Flag-style brag chip with a leading colored bar + variant icon. Shared
 * between /insights and /compare so both routes render the exact same
 * visual signature for the auto-generated brag label.
 */
export function BragChip({ brag, size = "md" }: { brag: string; size?: "sm" | "md" }) {
  const variant = chipVariant(brag);
  const text = size === "sm" ? "text-[10px]" : "text-xs";
  const padX = size === "sm" ? "px-2 py-1" : "px-3 py-1.5";
  return (
    <span className={`inline-flex items-stretch overflow-hidden rounded-md ${text} font-semibold tracking-[0.12em] uppercase`}>
      <span className={`w-[3px] ${variant.bar}`} />
      <span className={`flex items-center gap-2 ${padX} ${variant.body}`}>
        {variant.icon}
        {brag}
      </span>
    </span>
  );
}

function chipVariant(brag: string): { icon: ReactNode; bar: string; body: string } {
  if (/Bangalore's #1\b/.test(brag)) return { icon: <Trophy />, bar: "bg-amber-500", body: "bg-amber-50 text-amber-800" };
  if (/Bangalore's #[23]\b/.test(brag)) return { icon: <TrophyOutline />, bar: "bg-amber-400", body: "bg-amber-50 text-amber-800" };
  if (/Top 5%/.test(brag)) return { icon: <ShieldCheck />, bar: "bg-amber-500", body: "bg-amber-50 text-amber-800" };
  if (/Top 1[05]%/.test(brag)) return { icon: <Shield />, bar: "bg-amber-300", body: "bg-amber-50 text-amber-700" };
  return { icon: <Dot />, bar: "bg-slate-500", body: "bg-slate-100 text-slate-700" };
}

function Trophy() { return (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M6 4h12v3a6 6 0 0 1-5 5.917V16h2a2 2 0 0 1 2 2v2H7v-2a2 2 0 0 1 2-2h2v-3.083A6 6 0 0 1 6 7V4Zm-2 1h2v2H4a1 1 0 0 1 0-2Zm14 0h2a1 1 0 0 1 0 2h-2V5Z" />
  </svg>
);}
function TrophyOutline() { return (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 4h12v3a6 6 0 0 1-12 0V4Z" /><path d="M12 13v3" /><path d="M9 20h6" /><path d="M4 5h2M18 5h2" />
  </svg>
);}
function ShieldCheck() { return (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" />
  </svg>
);}
function Shield() { return (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </svg>
);}
function Dot() { return <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full bg-current" />; }
