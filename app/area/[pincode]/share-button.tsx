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

    const shareText = `🏘️ ${name} just scored ${score}/100 on @AreaIQ. Top ${topPct}% in India. What's your area? → ${fullUrl}`;

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
      // fallback: select text in a temp input
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

  return (
    <button
      onClick={handleShare}
      className="w-full flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm py-3.5 px-6 rounded-2xl shadow-lg shadow-amber-200 transition-all duration-150 select-none"
      aria-label="share this report card"
    >
      {copied ? (
        <>
          <svg
            width="16"
            height="16"
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
          copied to clipboard
        </>
      ) : (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
          >
            <path
              d="M10.5 1H5.5C4.67 1 4 1.67 4 2.5v9c0 .83.67 1.5 1.5 1.5h7c.83 0 1.5-.67 1.5-1.5V5L10.5 1z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 1v4h4"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 4.5v9C2 14.33 2.67 15 3.5 15H10"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          share this score
        </>
      )}
    </button>
  );
}
