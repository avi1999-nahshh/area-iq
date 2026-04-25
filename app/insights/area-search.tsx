"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BLR_ALIASES, displayName } from "./blr-aliases";
import { track } from "../_lib/track";

type Hit = {
  pincode: string;
  name: string;
  district: string;
  state: string;
};

/**
 * Match the typed term against our colloquial-name overrides ("Whitefield",
 * "K R Puram") that the Convex search index doesn't see — the index only
 * knows India Post's official `name` ("EPIP", "Krishnarajapuram R S"). For
 * the Bangalore-only release we patch this client-side; once we expand
 * cities we should persist alias values into a denormalised search field
 * on Convex instead.
 */
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
  basePath?: string;
  metroCity?: string | null;
  placeholder?: string;
  size?: "sm" | "lg";
  initialValue?: string;
}

export function AreaSearch({
  basePath = "/insights",
  metroCity = "Bengaluru",
  placeholder = "Search a Bangalore neighbourhood…",
  size = "lg",
  initialValue = "",
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [debounced, setDebounced] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input → query
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), 120);
    return () => clearTimeout(t);
  }, [value]);

  const trimmed = debounced.trim();
  const serverHits =
    useQuery(
      api.area.searchByName,
      trimmed.length >= 1
        ? { q: trimmed, limit: 8, metroCity: metroCity ?? undefined }
        : "skip",
    ) ?? null;

  // Merge server hits with local alias matches so colloquial searches like
  // "Whitefield" (which India Post stores as "EPIP" / "Mahadevapura") work.
  // Only applies when we're scoped to Bangalore; pass-through otherwise.
  const hits = (() => {
    if (serverHits === null) return null; // still loading
    if (trimmed.length < 1) return serverHits;
    if (metroCity !== "Bengaluru") return serverHits;
    const aliasHits = aliasMatches(trimmed);
    const seen = new Set(serverHits.map((h) => h.pincode));
    const merged = [...serverHits];
    for (const h of aliasHits) {
      if (!seen.has(h.pincode)) {
        merged.push(h);
        seen.add(h.pincode);
      }
    }
    return merged.slice(0, 8);
  })();

  // Click-outside closes
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(h: Hit) {
    track("Search Suggested", {
      pincode: h.pincode,
      surface: basePath.replace(/^\//, "") || "root",
    });
    setValue(displayName(h.pincode, h.name));
    setOpen(false);
    inputRef.current?.blur();
    router.push(`${basePath}/${h.pincode}`);
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
      const pick = hits?.[activeIdx];
      if (pick) {
        e.preventDefault();
        go(pick);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const heightClass = size === "sm" ? "h-9 text-sm" : "h-12 text-base";
  const iconSize = size === "sm" ? 16 : 20;

  // Render states
  const showDropdown = open && (trimmed.length >= 1 || value.length === 0);
  const isLoading = trimmed.length >= 1 && hits === null;
  const isEmpty = trimmed.length >= 1 && Array.isArray(hits) && hits.length === 0;
  const hasResults = Array.isArray(hits) && hits.length > 0;

  return (
    <div ref={wrapRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 px-3 ${heightClass} bg-white border border-gray-200 rounded-lg transition-all focus-within:border-amber-500 focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]`}
        onClick={() => inputRef.current?.focus()}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400 shrink-0"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActiveIdx(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-gray-400 min-w-0"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search neighbourhood"
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

      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden z-50"
          style={{ boxShadow: "0 8px 24px -8px rgba(15, 23, 42, 0.18)" }}
        >
          {value.length === 0 && (
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
              {hits!.map((h: Hit, i: number) => {
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
                      go(h);
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
