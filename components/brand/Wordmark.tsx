import Link from "next/link";
import { aarlaPlayCatalogUrl } from "@/lib/related-games";
import { cn } from "@/lib/utils";

export function Wordmark({
  compact = false,
  href = "/play/kelvi",
}: {
  compact?: boolean;
  href?: string;
}) {
  return (
    <div className="block text-center">
      <a
        href={aarlaPlayCatalogUrl()}
        target="_blank"
        rel="noreferrer"
        className="text-[10px] tracking-[0.38em] uppercase text-muted"
      >
        Aarla Play
      </a>
      {!compact ? (
        <Link href={href} className="font-serif mt-1 block text-3xl tracking-[0.18em] text-ink">
          KELVI
        </Link>
      ) : null}
    </div>
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
