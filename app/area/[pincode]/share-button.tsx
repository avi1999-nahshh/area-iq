"use client";

import { useState } from "react";

interface Props {
  text: string;
  url: string;
  score: number;
  name: string;
  topPct: number;
}

export function ShareButton({ text, url, score, name, topPct }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${url}`
        : url;

    const shareText = `${name} just scored ${score}/100 on @AreaIQ. Top ${topPct}% in India. What's your area? -> ${fullUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} scored ${score}/100 on AreaIQ`,
          text: shareText,
          url: fullUrl,
        });
        return;
      } catch {
        // user cancelled or share not available — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement("input");
      input.value = shareText;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  // Suppress unused prop warning — kept for API compatibility
  void text;

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 select-none whitespace-nowrap"
      style={{ background: "#0A0A0A", color: "#FDFCF7" }}
      aria-label="share this report card"
    >
      {copied ? (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
          >
            <path
              d="M3 8l3.5 3.5L13 4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          copied
        </>
      ) : (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
          >
            <path
              d="M11 3H5C4.45 3 4 3.45 4 4v9c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 1h4l3 3"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Share Report
        </>
      )}
    </button>
  );
}
