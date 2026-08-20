"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ShareResultButton({
  attemptId,
  variant = "result",
}: {
  attemptId: string;
  variant?: string;
}) {
  const [status, setStatus] = useState<"idle" | "working" | "saved" | "error">("idle");

  async function share() {
    setStatus("working");
    try {
      const response = await fetch(`/api/share/card?attemptId=${attemptId}&variant=${variant}`);
      if (!response.ok) throw new Error("share failed");
      const blob = await response.blob();
      const file = new File([blob], `kelvi-${attemptId}.png`, { type: "image/png" });
      const caption = "Can you beat me? Kelvi on Aarla Play. @aarla.play";

      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
        share?: (data: ShareData) => Promise<void>;
      };

      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text: caption, title: "Kelvi" });
        setStatus("idle");
        return;
      }

      if (nav.share) {
        await nav.share({ text: caption, title: "Kelvi" });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        "w-full rounded-full bg-ink py-4 text-sm tracking-[0.22em] text-ivory uppercase",
        status === "working" && "opacity-70",
      )}
    >
      {status === "working"
        ? "PREPARING…"
        : status === "saved"
          ? "SAVED IMAGE"
          : status === "error"
            ? "TRY AGAIN"
            : "SHARE RESULT"}
    </button>
  );
}
