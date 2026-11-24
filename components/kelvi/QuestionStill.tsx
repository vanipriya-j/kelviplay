"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const SCENES: Record<string, { from: string; to: string; accent: string; mark: string }> = {
  "Carnatic Music": { from: "#24160f", to: "#c4a57a", accent: "#f3ede2", mark: "♪" },
  "Indian Classical Arts": { from: "#2a1612", to: "#b5523a", accent: "#f3ede2", mark: "◈" },
  Tamil: { from: "#1c1915", to: "#6a6358", accent: "#ebe3d3", mark: "அ" },
  Chennai: { from: "#1e2428", to: "#c4a57a", accent: "#f3ede2", mark: "⌂" },
  Food: { from: "#2c1810", to: "#b5523a", accent: "#f3ede2", mark: "☕" },
  Festivals: { from: "#2a140c", to: "#c4a57a", accent: "#f3ede2", mark: "✦" },
  Temples: { from: "#1a1612", to: "#8a6a48", accent: "#f3ede2", mark: "△" },
  Literature: { from: "#221c16", to: "#6a6358", accent: "#ebe3d3", mark: "॥" },
  Traditions: { from: "#261810", to: "#3e5648", accent: "#f3ede2", mark: "◎" },
  Objects: { from: "#1c1915", to: "#8a6a48", accent: "#f3ede2", mark: "▢" },
  Places: { from: "#18201c", to: "#3e5648", accent: "#f3ede2", mark: "◇" },
  Cinema: { from: "#1a1210", to: "#b5523a", accent: "#f3ede2", mark: "▣" },
  History: { from: "#1c1814", to: "#6a6358", accent: "#ebe3d3", mark: "†" },
  People: { from: "#241810", to: "#c4a57a", accent: "#f3ede2", mark: "○" },
};

function sceneFor(category: string) {
  return SCENES[category] ?? { from: "#1c1915", to: "#c4a57a", accent: "#f3ede2", mark: "KELVI" };
}

export function QuestionStill({
  number,
  category,
  src,
  side,
}: {
  number: number;
  category: string;
  src?: string | null;
  side: "question" | "answer";
}) {
  const [failed, setFailed] = useState(false);
  const scene = sceneFor(category);
  const showImage = Boolean(src) && !failed;

  return (
    <div className="relative mt-6 overflow-hidden rounded-[28px] border border-rule">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? undefined}
          alt=""
          onError={() => setFailed(true)}
          className="h-56 w-full object-cover object-center"
        />
      ) : (
        <div
          className="relative h-56 w-full"
          style={{
            background: `radial-gradient(120% 90% at 20% 10%, ${scene.accent}22, transparent 46%), linear-gradient(165deg, ${scene.from}, ${scene.to})`,
          }}
        >
          <p className="absolute left-5 top-5 text-[10px] tracking-[0.32em] uppercase text-ivory/70">
            {side === "answer" ? "Answer still" : "Kelvi still"}
          </p>
          <p
            className={cn(
              "absolute inset-0 flex items-center justify-center font-serif text-ivory/80",
              scene.mark.length === 1 ? "text-7xl" : "text-2xl tracking-[0.28em]",
            )}
          >
            {scene.mark}
          </p>
          <p className="absolute bottom-5 left-5 text-[11px] tracking-[0.22em] uppercase text-ivory/75">
            {category}
          </p>
        </div>
      )}
      <p className="absolute bottom-5 right-5 font-serif text-sm text-ivory/90">#{number}</p>
    </div>
  );
}
