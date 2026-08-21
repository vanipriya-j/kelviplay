"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PlayFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-ivory shadow-[0_0_0_1px_rgba(28,25,21,0.04)]">
        <div className="flex min-h-dvh flex-col px-5 pb-24 pt-6">{children}</div>
        <PlayBottomNav />
      </div>
    </div>
  );
}

export function PlaySkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <p className="text-center text-[10px] tracking-[0.38em] uppercase text-muted">Aarla Play</p>
      <p className="font-serif mt-1 text-center text-3xl tracking-[0.18em] text-ink">KELVI</p>
      <div className="mt-16 space-y-3">
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
        : "home";

  const items = [
    { id: "home", href: "/play/kelvi", label: "Kelvi" },
    { id: "board", href: "/play/kelvi/leaderboard", label: "Week" },
    { id: "profile", href: "/play/profile", label: "You" },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-rule bg-ivory/95 backdrop-blur">
      <ul className="grid grid-cols-3 px-2 py-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              prefetch
              className={cn(
                "flex flex-col items-center py-2 text-[11px] tracking-[0.18em] uppercase",
                current === item.id ? "text-ink" : "text-muted",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
