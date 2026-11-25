"use client";

import { useState } from "react";
import { stillSceneFor, type StillMotif } from "@/lib/game/still-scene";

export function QuestionStill({
  number,
  category,
  title,
  questionText,
  src,
}: {
  number: number;
  category: string;
  title?: string | null;
  questionText: string;
  src?: string | null;
}) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const scene = stillSceneFor({ title, questionText, category });
  const photo = Boolean(src && loadedSrc === src);

  return (
    <div className="relative mt-6 overflow-hidden rounded-[28px] border border-rule">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onLoad={() => setLoadedSrc(src)}
          onError={() => setLoadedSrc(null)}
          className={photo ? "h-56 w-full object-cover object-center" : "hidden"}
        />
      ) : null}
      {photo ? null : (
        <div
          className="relative h-56 w-full"
          style={{
            background: `radial-gradient(120% 80% at 18% 8%, rgba(243,237,226,0.16), transparent 42%), linear-gradient(165deg, ${scene.from}, ${scene.to})`,
          }}
        >
          <StillMotifArt motif={scene.motif} />
        </div>
      )}
      <p className="pointer-events-none absolute bottom-5 right-5 font-serif text-sm text-ivory/85">
        #{number}
      </p>
    </div>
  );
}

function StillMotifArt({ motif }: { motif: StillMotif }) {
  return (
    <svg viewBox="0 0 320 224" className="absolute inset-0 h-full w-full" aria-hidden>
      {motif === "ask" ? (
        <>
          <circle cx="118" cy="86" r="28" fill="none" stroke="rgba(243,237,226,0.88)" strokeWidth="3" />
          <path d="M96 128c8 22 36 36 52 22" fill="none" stroke="rgba(243,237,226,0.88)" strokeWidth="3" />
          <path d="M168 70c22-8 48-4 62 18" fill="none" stroke="rgba(243,237,226,0.55)" strokeWidth="2" />
          <circle cx="214" cy="64" r="5" fill="rgba(243,237,226,0.8)" />
        </>
      ) : null}
      {motif === "coffee" ? (
        <>
          <ellipse cx="132" cy="148" rx="46" ry="12" fill="none" stroke="rgba(243,237,226,0.75)" strokeWidth="3" />
          <path d="M96 148c0-28 18-62 36-62s36 34 36 62" fill="none" stroke="rgba(243,237,226,0.9)" strokeWidth="3" />
          <rect x="188" y="78" width="28" height="54" rx="12" fill="none" stroke="rgba(243,237,226,0.9)" strokeWidth="3" />
          <path d="M202 78c0-18 10-32 10-46" fill="none" stroke="rgba(243,237,226,0.45)" strokeWidth="2" />
        </>
      ) : null}
      {motif === "stage" ? (
        <>
          <path d="M40 168h240" stroke="rgba(243,237,226,0.45)" strokeWidth="2" />
          <path d="M160 44l14 36h-28z" fill="rgba(243,237,226,0.9)" />
          <circle cx="160" cy="92" r="10" fill="none" stroke="rgba(243,237,226,0.7)" strokeWidth="2" />
          <path d="M70 168c20-40 50-64 90-64s70 24 90 64" fill="none" stroke="rgba(243,237,226,0.55)" strokeWidth="3" />
        </>
      ) : null}
      {motif === "gopuram" ? (
        <>
          <path d="M160 36l44 48h-28l28 40h-28l32 44H84l32-44H88l28-40H88z" fill="none" stroke="rgba(243,237,226,0.9)" strokeWidth="3" />
          <path d="M70 168h180" stroke="rgba(243,237,226,0.4)" strokeWidth="2" />
        </>
      ) : null}
      {motif === "pot" ? (
        <>
          <path d="M112 96c0-18 20-28 48-28s48 10 48 28c18 8 24 28 16 52-8 22-40 36-64 36s-56-14-64-36c-8-24-2-44 16-52z" fill="none" stroke="rgba(243,237,226,0.9)" strokeWidth="3" />
          <path d="M148 70c4-16 12-28 12-40" fill="none" stroke="rgba(243,237,226,0.5)" strokeWidth="2" />
        </>
      ) : null}
      {motif === "anklet" ? (
        <>
          <ellipse cx="160" cy="118" rx="54" ry="22" fill="none" stroke="rgba(243,237,226,0.9)" strokeWidth="3" />
          <circle cx="214" cy="118" r="6" fill="rgba(243,237,226,0.85)" />
          <circle cx="106" cy="118" r="6" fill="rgba(243,237,226,0.85)" />
        </>
      ) : null}
      {motif === "silk" ? (
        <path
          d="M64 168c32-48 48-88 96-96 48 8 64 48 96 96"
          fill="none"
          stroke="rgba(243,237,226,0.88)"
          strokeWidth="3"
        />
      ) : null}
      {motif === "rain" ? (
        <>
          {[90, 120, 150, 180, 210, 240].map((x) => (
            <path key={x} d={`M${x} 48l-10 88`} stroke="rgba(243,237,226,0.7)" strokeWidth="2" />
          ))}
        </>
      ) : null}
      {motif === "drum" ? (
        <>
          <ellipse cx="160" cy="88" rx="58" ry="22" fill="none" stroke="rgba(243,237,226,0.9)" strokeWidth="3" />
          <path d="M102 88v52c0 14 26 22 58 22s58-8 58-22V88" fill="none" stroke="rgba(243,237,226,0.9)" strokeWidth="3" />
        </>
      ) : null}
      {motif === "dance" ? (
        <>
          <circle cx="168" cy="58" r="14" fill="none" stroke="rgba(243,237,226,0.9)" strokeWidth="3" />
          <path d="M168 74c-8 28-4 52 8 78M168 96l-36 10M176 110l40-18" fill="none" stroke="rgba(243,237,226,0.9)" strokeWidth="3" />
        </>
      ) : null}
      {motif === "hand" ? (
        <>
          <path d="M140 168c0-40 8-72 20-96 8 24 16 24 22 4 8 28 14 28 20 8 6 32 18 48 18 84" fill="none" stroke="rgba(243,237,226,0.9)" strokeWidth="3" />
          <circle cx="182" cy="64" r="7" fill="rgba(243,237,226,0.8)" />
        </>
      ) : null}
      {motif === "city" ? (
        <>
          <path d="M70 168V96h36v72M118 168V72h40v96M170 168V108h48v60M230 168V88h28v80" fill="none" stroke="rgba(243,237,226,0.85)" strokeWidth="3" />
        </>
      ) : null}
      {motif === "horn" ? (
        <path d="M64 120c80-8 140-36 192-70M64 120c18 18 36 28 70 32" fill="none" stroke="rgba(243,237,226,0.9)" strokeWidth="3" />
      ) : null}
      {motif === "lamp" ? (
        <>
          <path d="M160 48c18 22 18 40 0 58-18-18-18-36 0-58z" fill="rgba(243,237,226,0.85)" />
          <path d="M132 118h56l-8 50h-40z" fill="none" stroke="rgba(243,237,226,0.85)" strokeWidth="3" />
        </>
      ) : null}
    </svg>
  );
}
