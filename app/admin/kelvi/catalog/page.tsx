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
      <h1 className="font-serif text-4xl">Stills</h1>
      <p className="mt-2 text-muted">
        GPT images belong on the play question. Put movie-poster stills in Drive{" "}
        <span className="text-ink">images/</span> as{" "}
        <span className="text-ink">kelvi-NNNN-question.png</span> and{" "}
        <span className="text-ink">kelvi-NNNN-answer.png</span>. The sheet is only the listing —
        sync never overwrites those pictures.
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
                {row.category} · {row.status}
              </p>
              <p className="mt-1 text-[10px] tracking-[0.14em] uppercase text-muted">
                {row.questionImage} · {row.answerImage}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
