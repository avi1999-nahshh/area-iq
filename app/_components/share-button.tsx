"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "../_lib/track";

interface Props {
  /** Where this button lives — for analytics */
  surface: "insights" | "compare" | "proximity";
  /** Pre-built share payload (use _lib/share-copy.ts) */
  share: { title: string; text: string; url: string };
  /** Optional extra props on the analytics event (e.g. pincode, winner) */
  trackProps?: Record<string, string | number | boolean>;
  /** Visual size */
  size?: "sm" | "md";
  /** Visual variant */
  variant?: "primary" | "ghost";
  /** Override the visible label */
  label?: string;
}

/**
 * Native Web Share on mobile, fallback dropdown (WhatsApp / X / LinkedIn /
 * Copy) on desktop. Every action fires a `Share Clicked` analytics event
 * with `surface` + `target`.
 */
export function ShareButton({
  surface,
  share,
  trackProps,
  size = "md",
  variant = "primary",
  label = "Share",
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Detect Web Share API support once. SSR-safe.
  const [hasNativeShare, setHasNativeShare] = useState(false);
  useEffect(() => {
    setHasNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  // Click-outside closes
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
  }, [open]);

  function fire(target: string) {
    track("Share Clicked", { surface, target, ...(trackProps ?? {}) });
  }

  async function onClick() {
    if (hasNativeShare) {
      fire("native");
      try {
        await navigator.share({
          title: share.title,
          text: share.text,
          url: share.url,
        });
      } catch {
        /* user dismissed — fine */
      }
      return;
    }
    setOpen((o) => !o);
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(`${share.text} ${share.url}`)}`;
  const x = `https://x.com/intent/post?text=${encodeURIComponent(share.text)}&url=${encodeURIComponent(share.url)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(share.url)}`;

  function onCopy() {
    fire("copy");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(share.url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    }
    setOpen(false);
  }

  const sizeCls =
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  const variantCls =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : "bg-white text-slate-900 border border-slate-200 hover:border-slate-300";

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={onClick}
        aria-haspopup={!hasNativeShare}
        aria-expanded={open}
        className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold ${sizeCls} ${variantCls} active:translate-y-[1px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3]`}
      >
        <ShareIcon />
        {copied ? "Copied" : label}
      </button>

      {open && !hasNativeShare && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg overflow-hidden z-50"
          style={{ boxShadow: "0 8px 24px -8px rgba(15, 23, 42, 0.18)" }}
        >
          <ShareLink href={wa} onClick={() => fire("whatsapp")}>WhatsApp</ShareLink>
          <ShareLink href={x} onClick={() => fire("x")}>X (Twitter)</ShareLink>
          <ShareLink href={li} onClick={() => fire("linkedin")}>LinkedIn</ShareLink>
          <button
            type="button"
            role="menuitem"
            onClick={onCopy}
            className="block w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
          >
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}

function ShareLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      role="menuitem"
      onClick={onClick}
      className="block w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
    >
      {children}
    </a>
  );
}

function ShareIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
