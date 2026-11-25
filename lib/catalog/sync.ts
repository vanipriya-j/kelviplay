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
import { catalogCsv, listCatalogRows } from "./rows";

export type CatalogSyncResult = {
  rows: number;
  uploaded: Array<{ number: number; fileId: string }>;
  errors: Array<{ number: number; error: string }>;
  nextNumber: number | null;
  folderUrl: string;
  sheetUrl: string;
  imagesFolderUrl: string;
};

/**
 * Sync the listing only. GPT movie-poster stills live in images/ and are
 * shown on the play question. Do not overwrite them with generated type cards.
 */
export async function syncCatalogToDrive(
  db: PrismaClient,
  options: {
    drive?: DriveClient;
  } = {},
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

  return {
    rows: rows.length,
    uploaded: [],
    errors: [],
    nextNumber: null,
    folderUrl: driveFolderUrl(folderId),
    sheetUrl: sheet.webViewLink ?? driveFolderUrl(folderId),
    imagesFolderUrl: images.webViewLink ?? driveFolderUrl(images.id),
  };
}
