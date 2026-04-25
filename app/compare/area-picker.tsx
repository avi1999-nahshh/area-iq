"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BLR_ALIASES, displayName } from "@/app/insights/blr-aliases";

type Hit = {
  pincode: string;
  name: string;
  district: string;
  state: string;
};

function aliasMatches(term: string): Hit[] {
  const q = term.toLowerCase();
  return Object.entries(BLR_ALIASES)
    .filter(([, alias]) => alias.toLowerCase().includes(q))
    .map(([pincode, alias]) => ({
      pincode,
      name: alias,
      district: "Bangalore",
      state: "Karnataka",
    }));
}

interface Props {
  label: string;          // "A" / "B"
  initialPincode: string; // resolves to displayName for the input value
  onPick: (pincode: string) => void;
  highlightTone: "amber" | "slate";
}

/**
 * Two-bar comparison picker — variant of <AreaSearch> that calls a callback
 * instead of routing. The parent owns the URL writes so both bars update
 * together to a single canonical slug.
 */
export function AreaPicker({ label, initialPincode, onPick, highlightTone }: Props) {
  const initialDisplay =
    BLR_ALIASES[initialPincode]?.replace(/\s*\(Bangalore\)\s*$/i, "") ?? initialPincode;
  const [value, setValue] = useState(initialDisplay);
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset display when the parent swaps pincode (e.g., user edited the URL).
  useEffect(() => {
    setValue(
      BLR_ALIASES[initialPincode]?.replace(/\s*\(Bangalore\)\s*$/i, "") ?? initialPincode,
    );
  }, [initialPincode]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), 120);
    return () => clearTimeout(t);
  }, [value]);

  const trimmed = debounced.trim();
  const serverHits =
    useQuery(
      api.area.searchByName,
      trimmed.length >= 1
        ? { q: trimmed, limit: 8, metroCity: "Bengaluru" }
        : "skip",
    ) ?? null;

  const hits: Hit[] | null = (() => {
    if (serverHits === null) return null;
    if (trimmed.length < 1) return [];
    const aliasHits = aliasMatches(trimmed);
    const seen = new Set<string>(serverHits.map((h: Hit) => h.pincode));
    const merged: Hit[] = [...serverHits];
    for (const h of aliasHits) {
      if (!seen.has(h.pincode)) {
        merged.push(h);
        seen.add(h.pincode);
      }
    }
    return merged.slice(0, 8);
  })();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(h: Hit) {
    setValue(displayName(h.pincode, h.name).replace(/\s*\(Bangalore\)\s*$/i, ""));
    setOpen(false);
    inputRef.current?.blur();
    onPick(h.pincode);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min((hits?.length ?? 0) - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      const p = hits?.[activeIdx];
      if (p) {
        e.preventDefault();
        pick(p);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const isLoading = trimmed.length >= 1 && hits === null;
  const isEmpty = trimmed.length >= 1 && Array.isArray(hits) && hits.length === 0;
  const hasResults = Array.isArray(hits) && hits.length > 0;

  const ringTone =
    highlightTone === "amber"
      ? "focus-within:border-amber-500 focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]"
      : "focus-within:border-slate-700 focus-within:shadow-[0_0_0_3px_rgba(15,23,42,0.10)]";

  const labelTone =
    highlightTone === "amber"
      ? "bg-amber-100 text-amber-800"
      : "bg-slate-100 text-slate-700";

  return (
    <div ref={wrapRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 px-3 h-14 bg-white border border-gray-200 rounded-xl transition-all ${ringTone}`}
        onClick={() => inputRef.current?.focus()}
      >
        <span
          className={`shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md text-xs font-bold tracking-wider ${labelTone}`}
          aria-hidden
        >
          {label}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActiveIdx(0);
          }}
          onFocus={() => {
            // Empty the field on focus so users don't have to backspace
            // through "Indiranagar" before typing a new area.
            if (value.length > 0) {
              setValue("");
              setDebounced("");
            }
            setOpen(true);
          }}
          onKeyDown={onKey}
          placeholder={`Pick area ${label}…`}
          className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-gray-400 min-w-0 text-base font-medium"
          autoComplete="off"
          spellCheck={false}
          aria-label={`Pick area ${label}`}
        />
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setValue("");
              setDebounced("");
              inputRef.current?.focus();
            }}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            aria-label="Clear"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden z-50"
          style={{ boxShadow: "0 10px 32px -10px rgba(15, 23, 42, 0.22)" }}
        >
          {value.length === 0 && trimmed.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Try Indiranagar, Koramangala, HSR Layout, Whitefield…
            </div>
          )}
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
              Searching Bangalore…
            </div>
          )}
          {isEmpty && (
            <div className="px-4 py-3 text-sm text-gray-500">
              No matches in Bangalore for &ldquo;{trimmed}&rdquo;.
            </div>
          )}
          {hasResults && (
            <ul role="listbox">
              {hits!.map((h, i) => {
                const display = displayName(h.pincode, h.name);
                const showOriginal = display !== h.name;
                return (
                  <li
                    key={h.pincode}
                    role="option"
                    aria-selected={i === activeIdx}
                    onMouseEnter={() => setActiveIdx(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(h);
                    }}
                    className={`px-4 py-2.5 cursor-pointer flex items-baseline justify-between gap-3 ${
                      i === activeIdx ? "bg-amber-50" : "bg-white"
                    }`}
                  >
                    <span className="flex flex-col min-w-0">
                      <span className="font-semibold text-slate-900 truncate">
                        {display}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        {showOriginal ? `${h.name} · ` : ""}
                        {h.district}, {h.state}
                      </span>
                    </span>
                    <span className="text-xs font-mono text-gray-400 shrink-0">{h.pincode}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
