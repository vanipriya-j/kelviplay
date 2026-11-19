import type { PrismaClient } from "@prisma/client";
import {
  CATALOG_SHEET_NAME,
  IMAGES_FOLDER_NAME,
  createDriveClient,
  driveFolderUrl,
  ensureFolder,
  findCatalogSheet,
  upsertFile,
  type DriveClient,
} from "./drive";
import { driveFolderId, isDriveConfigured } from "./google-auth";
import { catalogCsv, listCatalogRows, type CatalogRow } from "./rows";

export const CATALOG_SYNC_BATCH = 8;

export type CatalogSyncResult = {
  rows: number;
  uploaded: Array<{ number: number; fileId: string }>;
  errors: Array<{ number: number; error: string }>;
  nextNumber: number | null;
  folderUrl: string;
  sheetUrl: string;
  imagesFolderUrl: string;
};

export async function syncCatalogToDrive(
  db: PrismaClient,
  options: {
    renderPoster: (row: CatalogRow) => Promise<Uint8Array>;
    drive?: DriveClient;
    afterNumber?: number;
    limit?: number;
  },
): Promise<CatalogSyncResult> {
  if (!isDriveConfigured()) {
    throw new Error(
      "Set GOOGLE_DRIVE_FOLDER_ID and GOOGLE_SERVICE_ACCOUNT_JSON, then share the folder with the service account as Editor.",
    );
  }

  const folderId = driveFolderId();
  const client = options.drive ?? (await createDriveClient());
  const rows = await listCatalogRows(db);
  const sheet = await upsertFile(client, {
    parentId: folderId,
    name: CATALOG_SHEET_NAME,
    bytes: Buffer.from(catalogCsv(rows), "utf8"),
    contentType: "text/csv",
    existing: await findCatalogSheet(client, folderId),
    convertToSheet: true,
  });
  const images = await ensureFolder(client, folderId, IMAGES_FOLDER_NAME);

  const after = options.afterNumber ?? 0;
  const limit = options.limit ?? CATALOG_SYNC_BATCH;
  const batch = rows.filter((row) => row.number > after).slice(0, limit);
  const uploaded: CatalogSyncResult["uploaded"] = [];
  const errors: CatalogSyncResult["errors"] = [];

  for (const row of batch) {
    try {
      const png = await options.renderPoster(row);
      const file = await upsertFile(client, {
        parentId: images.id,
        name: row.imageFile,
        bytes: png,
        contentType: "image/png",
      });
      uploaded.push({ number: row.number, fileId: file.id });
    } catch (error) {
      errors.push({
        number: row.number,
        error: error instanceof Error ? error.message : "Could not upload image.",
      });
    }
  }

  const last = batch.at(-1)?.number ?? after;
  const remaining = rows.some((row) => row.number > last);

  return {
    rows: rows.length,
    uploaded,
    errors,
    nextNumber: remaining ? last : null,
    folderUrl: driveFolderUrl(folderId),
    sheetUrl: sheet.webViewLink ?? driveFolderUrl(folderId),
    imagesFolderUrl: images.webViewLink ?? driveFolderUrl(images.id),
  };
}
