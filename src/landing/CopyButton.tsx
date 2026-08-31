"use client";

import { useState } from "react";

export default function CopyButton({
  code,
  copyLabel,
  copiedLabel,
}: {
  code: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="absolute top-2 right-2 rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/90 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}
