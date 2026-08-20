import { AppShell } from "@/components/layout/AppShell";
import { Wordmark } from "@/components/brand/Wordmark";

export default function NotFound() {
  return (
    <AppShell>
      <Wordmark />
      <h1 className="font-serif mt-16 text-4xl">This page has left the sabha.</h1>
      <p className="mt-4 text-muted">Try the live Kelvi instead.</p>
    </AppShell>
  );
}
