"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Suspense } from "react";

function VerifyClient() {
  const params = useSearchParams();
  const token = params.get("token");

  useEffect(() => {
    if (!token) return;
    void signIn("kelvi", {
      kind: "magic",
      token,
      callbackUrl: "/play/kelvi",
      redirect: true,
    });
  }, [token]);

  return (
    <AppShell>
      <p className="animate-kelvi-pulse mt-32 text-center font-serif text-3xl tracking-[0.2em]">KELVI</p>
      <p className="mt-6 text-center text-sm text-muted">Opening your seat…</p>
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
