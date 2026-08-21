"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Suspense } from "react";
import { completeMagicLinkAction } from "@/lib/actions/auth";

function VerifyClient() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [error, setError] = useState<string | null>(
    token ? null : "That link is missing a token.",
  );

  useEffect(() => {
    if (!token) return;
    void (async () => {
      const result = await completeMagicLinkAction(token);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/play/kelvi");
    })();
  }, [token, router]);

  return (
    <AppShell>
      <p className="animate-kelvi-pulse mt-32 text-center font-serif text-3xl tracking-[0.2em]">KELVI</p>
      <p className="mt-6 text-center text-sm text-muted">
        {error ?? "Opening your seat…"}
      </p>
    </AppShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <p className="animate-kelvi-pulse mt-32 text-center font-serif text-3xl tracking-[0.2em]">KELVI</p>
        </AppShell>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}
