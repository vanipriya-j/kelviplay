import { CatalogPanel } from "@/components/admin/CatalogPanel";
import { driveFolderUrl } from "@/lib/catalog/drive";
import { isDriveConfigured, serviceAccountEmail } from "@/lib/catalog/google-auth";
import { listCatalogRows } from "@/lib/catalog/rows";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function CatalogPage() {
  const rows = await listCatalogRows(prisma).catch(() => []);
  const configured = isDriveConfigured();

  return (
    <div>
      <h1 className="font-serif text-4xl">Catalog</h1>
      <p className="mt-2 text-muted">
        Every Kelvi in one Drive folder: a spreadsheet of the list, plus a poster image for each
        number. Posters show the question. Answers stay in the sheet only.
      </p>

      <CatalogPanel
        configured={configured}
        serviceEmail={serviceAccountEmail()}
        folderUrl={configured ? driveFolderUrl() : ""}
        total={rows.length}
      />

      <ul className="mt-10 divide-y divide-rule">
        {rows.map((row) => (
          <li key={row.number} className="flex items-start justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="font-serif text-xl">
                #{row.number} {row.title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{row.question}</p>
              <p className="mt-2 text-[10px] tracking-[0.16em] uppercase text-muted">
                {row.category} · {row.status} · {row.imageFile}
              </p>
            </div>
            <a
              href={`/api/catalog/card?number=${row.number}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs tracking-[0.14em] uppercase"
            >
              Preview
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
