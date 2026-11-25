"use client";

import Link, { useLinkStatus } from "next/link";
import { useSyncExternalStore, type ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function readTheme() {
  try {
    return localStorage.getItem("kelvi-theme") === "day" ? "day" : "night";
  } catch {
    return "night";
  }
}

function subscribeTheme(update: () => void) {
  window.addEventListener("kelvi-theme", update);
  window.addEventListener("storage", update);
  return () => {
    window.removeEventListener("kelvi-theme", update);
    window.removeEventListener("storage", update);
  };
}

export function PlayFrame({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "night");
  function toggleTheme() {
    try {
      localStorage.setItem("kelvi-theme", theme === "night" ? "day" : "night");
      window.dispatchEvent(new Event("kelvi-theme"));
    } catch {
      // Storage can be disabled in embedded or restricted browsers.
    }
  }

  return (
    <div className="kelvi-frame" data-theme={theme}>
      <div className="kelvi-shell">
        <div className="kelvi-topbar">
          <Link href="/play/kelvi" aria-label="Kelvi home" className="font-serif text-3xl tracking-tight">Kelvi<span className="text-terracotta">.</span></Link>
          <button type="button" onClick={toggleTheme} className="kelvi-theme" aria-label={theme === "night" ? "Switch to Day mode" : "Switch to Night mode"}>
            <span aria-hidden>{theme === "night" ? "☀" : "☾"}</span>
            {theme === "night" ? "Day mode" : "Night mode"}
          </button>
        </div>
        <div className="kelvi-content">{children}</div>
        <PlayBottomNav />
      </div>
    </div>
  );
}

export function PlaySpinner() {
  return <span aria-hidden className="kelvi-spinner" />;
}

export function PlayLink({ children, className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props} className={cn("kelvi-play-link", className)}>
      <LinkFeedback>{children}</LinkFeedback>
    </Link>
  );
}

function LinkFeedback({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return pending ? <span role="status" className="inline-flex items-center gap-2"><PlaySpinner /> Opening…</span> : children;
}

export function PlaySkeleton() {
  return (
    <div role="status" className="flex flex-1 flex-col">
      <p className="text-center text-[10px] tracking-[0.38em] uppercase text-muted">Aarla Play</p>
      <p className="font-serif mt-1 text-center text-3xl tracking-[0.18em] text-ink">KELVI</p>
      <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted"><PlaySpinner /> Opening Kelvi…</p>
      <div aria-hidden className="mt-8 animate-pulse space-y-3">
        <div className="mx-auto h-3 w-24 rounded-full bg-rule/70" />
        <div className="mx-auto h-10 w-52 rounded-full bg-rule/50" />
        <div className="mx-auto h-4 w-40 rounded-full bg-rule/40" />
      </div>
      <div className="mt-14 grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl border border-rule bg-cloud" />
        <div className="h-24 rounded-2xl border border-rule bg-cloud" />
      </div>
    </div>
  );
}

function PlayBottomNav() {
  const pathname = usePathname();
  const current =
    pathname.startsWith("/play/profile")
      ? "profile"
      : pathname.startsWith("/play/kelvi/leaderboard")
        ? "board"
        : pathname.startsWith("/play/kelvi/practice") ? "practice" : "home";

  const items = [
    { id: "home", href: "/play/kelvi", label: "Kelvi" },
    { id: "practice", href: "/play/kelvi/practice", label: "Practice" },
    { id: "board", href: "/play/kelvi/leaderboard", label: "Ranks" },
    { id: "profile", href: "/play/profile", label: "You" },
  ] as const;

  return (
    <nav aria-label="Play navigation" className="kelvi-nav">
      <ul className="grid grid-cols-4 px-2 py-1">
        {items.map((item) => (
          <li key={item.id}>
            <PlayLink
              aria-current={current === item.id ? "page" : undefined}
              href={item.href}
              prefetch
              className={cn(
                "flex min-h-11 flex-col items-center justify-center rounded-lg text-[11px] tracking-[0.18em] uppercase",
                current === item.id ? "bg-paper text-ink" : "text-muted",
              )}
            >
              {item.label}
            </PlayLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
