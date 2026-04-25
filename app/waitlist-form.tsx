"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type Status = "idle" | "loading" | "joined" | "already_joined" | "error";

function WaitlistFormInner({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const joinWaitlist = useMutation(api.waitlist.join);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    try {
      const result = await joinWaitlist({ email });
      setStatus(result.status);
      if (result.status === "joined") setEmail("");
    } catch {
      setStatus("error");
    }
  }

  const inputBase =
    "flex-1 min-w-0 rounded-xl px-4 py-3 text-sm outline-none transition-all duration-150 border";

  const inputStyle = dark
    ? `${inputBase} bg-white/10 border-white/10 text-white placeholder:text-slate-400 focus:border-amber-400 focus:bg-white/15`
    : `${inputBase} bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100`;

  return (
    <div className="flex flex-col items-center gap-3">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="your@email.com"
          className={inputStyle}
          disabled={status === "loading"}
        />
        <button
          type="submit"
          disabled={status === "loading" || !email}
          className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 active:scale-[0.97] active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-6 py-3 transition-all duration-150 cursor-pointer"
        >
          {status === "loading" ? "Joining…" : "Join Waitlist"}
        </button>
      </form>

      {status === "joined" && (
        <p className="text-sm text-emerald-500 font-medium">
          ✓ You&apos;re on the list! We&apos;ll reach out when we launch.
        </p>
      )}
      {status === "already_joined" && (
        <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
          You&apos;re already on the waitlist. We&apos;ll be in touch soon.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-500">
          Something went wrong. Please try again.
        </p>
      )}
      {status === "idle" && (
        <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
          Works for any pincode in India · No spam.
        </p>
      )}
    </div>
  );
}

// Renders a static version when Convex is not yet connected (no env var)
function WaitlistFormStatic({ dark = false }: { dark?: boolean }) {
  const inputBase =
    "flex-1 min-w-0 rounded-xl px-4 py-3 text-sm outline-none transition-all duration-150 border";
  const inputStyle = dark
    ? `${inputBase} bg-white/10 border-white/10 text-white placeholder:text-slate-400`
    : `${inputBase} bg-white border-slate-200 text-slate-900 placeholder:text-slate-400`;

  return (
    <div className="flex flex-col items-center gap-3">
      <form className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <input
          type="email"
          placeholder="your@email.com"
          className={inputStyle}
          disabled
        />
        <button
          disabled
          className="shrink-0 rounded-xl bg-amber-500 opacity-50 cursor-not-allowed text-white font-semibold text-sm px-6 py-3"
        >
          Join Waitlist
        </button>
      </form>
      <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
        No spam. Bangalore-only for now.
      </p>
    </div>
  );
}

export function WaitlistForm({ dark = false }: { dark?: boolean }) {
  const hasConvex = !!process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!hasConvex) return <WaitlistFormStatic dark={dark} />;
  return <WaitlistFormInner dark={dark} />;
}
