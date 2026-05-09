"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface Props {
  code: string;
  /** URL peers can open to land on the join screen with the code pre-filled. */
  joinUrl: string;
}

/**
 * Big mono room code with copy + share + QR. Copy is always available; share
 * uses the Web Share API when the browser supports it. QR is rendered locally
 * (no network) so it works on a closed-LAN gathering.
 */
export function RoomCodeCard({ code, joinUrl }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState<"none" | "code" | "link">("none");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(joinUrl, { width: 220, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => setQr(null));
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function copy(kind: "code" | "link") {
    const text = kind === "code" ? code : joinUrl;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied("none"), 1500);
    } catch {
      /* clipboard may be blocked */
    }
  }

  async function share() {
    if (!canShare) {
      void copy("link");
      return;
    }
    try {
      await navigator.share({
        title: "Praxis party room",
        text: `Join my Hegemony game — code ${code}`,
        url: joinUrl,
      });
    } catch {
      /* user cancelled or share failed */
    }
  }

  return (
    <div className="rounded-lg border border-rule/60 bg-surface/40 p-6">
      <p className="editorial-eyebrow">Your room code</p>
      <button
        type="button"
        onClick={() => copy("code")}
        className="mt-3 block w-full text-left font-mono text-5xl tracking-[0.35em] text-accentInk transition-colors hover:text-accentInk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        title="Click to copy code"
      >
        {code}
      </button>
      <p className="mt-2 font-serif text-xs italic text-inkMute">
        Friends type this into Join — or scan the QR below to land on the join screen with the code pre-filled.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => copy("code")}>
          {copied === "code" ? "Copied!" : "Copy code"}
        </button>
        <button type="button" className="btn" onClick={() => copy("link")}>
          {copied === "link" ? "Copied!" : "Copy invite link"}
        </button>
        <button type="button" className="btn btn-primary" onClick={share}>
          {canShare ? "Share invite…" : "Copy & share"}
        </button>
      </div>

      {qr ? (
        <div className="mt-6 flex flex-col items-center gap-2 border-t border-rule/40 pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt={`QR code linking to ${joinUrl}`}
            className="h-[220px] w-[220px] rounded-md border border-rule/40 bg-white p-2"
            width={220}
            height={220}
          />
          <p className="font-serif text-[11px] italic text-inkMute break-all text-center">
            {joinUrl}
          </p>
        </div>
      ) : null}
    </div>
  );
}
