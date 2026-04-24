"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PincodeSearch() {
  const router = useRouter();
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(val);
    if (error) setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pincode.length !== 6) {
      setError("Enter a valid 6-digit pincode");
      return;
    }
    setLoading(true);
    router.push(`/area/${pincode}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
      <div className="flex-1">
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={pincode}
            onChange={handleChange}
            placeholder="Enter pincode (e.g. 560034)"
            className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
            disabled={loading}
            aria-label="Pincode"
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-500">{error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || pincode.length !== 6}
        className="shrink-0 px-5 py-2.5 text-sm font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Checking…
          </>
        ) : (
          "Check area"
        )}
      </button>
    </form>
  );
}
