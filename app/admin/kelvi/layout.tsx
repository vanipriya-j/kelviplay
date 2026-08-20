import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/auth?next=/admin/kelvi");

  return (
    <div className="min-h-dvh bg-ivory">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8 md:flex-row">
        <aside className="w-full md:w-48 shrink-0">
          <p className="text-[10px] tracking-[0.28em] uppercase text-muted">Aarla Play</p>
          <p className="font-serif mt-1 text-2xl">Kelvi</p>
          <nav className="mt-6 grid gap-2 text-sm">
            <Link href="/admin/kelvi">Dashboard</Link>
            <Link href="/admin/kelvi/questions">Questions</Link>
            <Link href="/admin/kelvi/players">Players</Link>
            <Link href="/admin/kelvi/rewards">Rewards</Link>
            <Link href="/play/kelvi" className="text-muted">
              View game
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
