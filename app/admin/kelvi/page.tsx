import { getAdminDashboard } from "@/lib/game/admin";
import { formatResponseSeconds } from "@/lib/game/time";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();

  return (
    <div>
      <h1 className="font-serif text-4xl">Today’s room</h1>
      {data.live ? (
        <p className="mt-2 text-muted">
          Kelvi #{data.live.number} · {data.live.status}
        </p>
      ) : (
        <p className="mt-2 text-muted">No live Kelvi.</p>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat label="Playing" value={String(data.playing)} />
        <Stat label="Submitted" value={String(data.submitted)} />
        <Stat label="Correct" value={data.correctRate != null ? `${data.correctRate}%` : "—"} />
        <Stat
          label="Avg time"
          value={data.avgResponseMs != null ? `${formatResponseSeconds(data.avgResponseMs)}s` : "—"}
        />
        <Stat
          label="Fastest"
          value={data.fastestMs != null ? `${formatResponseSeconds(data.fastestMs)}s` : "—"}
        />
      </dl>

      <h2 className="mt-12 text-[11px] tracking-[0.22em] uppercase text-muted">Upcoming</h2>
      <ul className="mt-4 divide-y divide-rule">
        {data.upcoming.map((item) => (
          <li key={item.id} className="flex justify-between py-3 text-sm">
            <span>
              #{item.number} {item.internalTitle}
            </span>
            <span className="text-muted">{item.category.name}</span>
          </li>
        ))}
        {data.upcoming.length === 0 ? <li className="py-3 text-sm text-muted">Nothing scheduled.</li> : null}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-rule px-4 py-4">
      <dt className="text-[10px] tracking-[0.16em] uppercase text-muted">{label}</dt>
      <dd className="font-serif mt-1 text-3xl">{value}</dd>
    </div>
  );
}
