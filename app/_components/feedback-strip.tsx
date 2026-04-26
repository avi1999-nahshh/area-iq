"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { track } from "../_lib/track";

type Surface = "reach" | "compare" | "insights" | "landing";

interface Props {
  surface: Surface;
  /** Pincode, pair-slug, etc. for context */
  context?: string;
  /** Override the question label */
  label?: string;
  monoClass: string;
}

export function FeedbackStrip({ surface, context, label, monoClass }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [thumbed, setThumbed] = useState<"up" | "down" | null>(null);
  const [done, setDone] = useState(false);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");

  const submit = useMutation(api.feedback.submit);

  const ua = (): string | undefined =>
    typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : undefined;

  async function onThumb(sentiment: "up" | "down") {
    if (thumbed || submitting) return;
    setThumbed(sentiment);
    track("Feedback Thumbs", {
      surface,
      sentiment,
      ...(context ? { context } : {}),
    });
    try {
      await submit({
        surface,
        sentiment,
        ...(context ? { context } : {}),
        user_agent: ua(),
      });
    } catch {
      /* silent — don't break the page */
    }
  }

  async function onSubmitText() {
    if (submitting) return;
    if (!comment.trim()) return;
    setSubmitting(true);
    track("Feedback Comment Submitted", {
      surface,
      has_email: email.trim().length > 0,
      ...(context ? { context } : {}),
    });
    try {
      await submit({
        surface,
        sentiment: "text",
        comment: comment.trim(),
        email: email.trim() || undefined,
        ...(context ? { context } : {}),
        user_agent: ua(),
      });
      setDone(true);
    } catch {
      /* silent — but allow retry */
    } finally {
      setSubmitting(false);
    }
  }

  const heading = label ?? DEFAULT_LABEL[surface];

  if (done) {
    return (
      <section className="mt-8 sm:mt-10 border-t border-slate-200/70 pt-5">
        <p className={`${monoClass} text-[11px] font-semibold tracking-[0.18em] uppercase text-amber-700`}>
          Thanks — feedback received.
        </p>
        <p className="mt-2 text-sm text-slate-600 italic">
          We read every one. Builds the next version.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 sm:mt-10 border-t border-slate-200/70 pt-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className={`${monoClass} text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-500`}>
          {heading}
        </span>
        <div className="flex items-center gap-1.5 sm:ml-auto">
          <ThumbButton on={() => onThumb("up")} active={thumbed === "up"} disabled={!!thumbed} label="up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7V10l5-8a2 2 0 0 1 2 1.5z" />
            </svg>
          </ThumbButton>
          <ThumbButton on={() => onThumb("down")} active={thumbed === "down"} disabled={!!thumbed} label="down">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H17v12l-5 8a2 2 0 0 1-2-1.5z" />
            </svg>
          </ThumbButton>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3] rounded"
          >
            {expanded ? "Cancel" : "Tell us more →"}
          </button>
        </div>
      </div>

      {thumbed && !expanded && (
        <p className="mt-2 text-xs text-slate-500 italic">
          Thanks for the {thumbed === "up" ? "thumbs up" : "thumbs down"}.
        </p>
      )}

      {expanded && (
        <div className="mt-4 space-y-3 max-w-xl">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What's working? What's missing? What's wrong?"
            rows={3}
            maxLength={2000}
            className="w-full px-3 py-2.5 text-sm rounded-md border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com (optional)"
              maxLength={200}
              className="flex-1 min-w-0 px-3 py-2.5 text-sm rounded-md border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            <button
              type="button"
              onClick={onSubmitText}
              disabled={submitting || comment.trim().length === 0}
              className="shrink-0 rounded-md bg-amber-500 hover:bg-amber-400 active:scale-[0.97] active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 transition-all duration-150"
            >
              {submitting ? "Sending…" : "Send feedback"}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            No login. Email is optional and we won&apos;t share it.
          </p>
        </div>
      )}
    </section>
  );
}

const DEFAULT_LABEL: Record<Surface, string> = {
  reach: "Were these matches useful?",
  compare: "Did the verdict feel right?",
  insights: "Anything wrong with this report?",
  landing: "Got feedback?",
};

function ThumbButton({
  on,
  active,
  disabled,
  label,
  children,
}: {
  on: () => void;
  active: boolean;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={on}
      disabled={disabled}
      aria-label={`Thumbs ${label}`}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3] ${
        active
          ? "bg-amber-100 text-amber-800"
          : disabled
          ? "text-slate-300 cursor-not-allowed"
          : "text-slate-500 hover:bg-amber-50 hover:text-amber-700 active:scale-[0.96]"
      }`}
    >
      {children}
    </button>
  );
}
