import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({
  compact = false,
  href = "/play",
}: {
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="block text-center">
      <p className="text-[10px] tracking-[0.38em] uppercase text-muted">Aarla Play</p>
      {!compact ? (
        <p className="font-serif text-3xl tracking-[0.18em] text-ink mt-1">KELVI</p>
      ) : null}
    </Link>
  );
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full bg-terracotta animate-kelvi-pulse",
        className,
      )}
    />
  );
}
