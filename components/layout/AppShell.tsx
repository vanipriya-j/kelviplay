import Link from "next/link";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-ivory shadow-[0_0_0_1px_rgba(28,25,21,0.04)]">
        <div className="flex min-h-dvh flex-col px-5 pb-24 pt-6">{children}</div>
        {footer}
      </div>
    </div>
  );
}

export function BottomNav({ current }: { current: "home" | "board" | "profile" }) {
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
