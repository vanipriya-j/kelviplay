import { driveFolderId, googleAccessToken } from "./google-auth";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

export const CATALOG_SHEET_NAME = "Kelvi catalog";
export const IMAGES_FOLDER_NAME = "images";
export const SHEET_MIME = "application/vnd.google-apps.spreadsheet";
export const FOLDER_MIME = "application/vnd.google-apps.folder";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
};

export type DriveClient = {
  token: string;
  fetch: typeof fetch;
};

export function driveFolderUrl(id = driveFolderId()) {
  return id ? `https://drive.google.com/drive/folders/${id}` : "";
}

export async function createDriveClient(fetchImpl: typeof fetch = fetch): Promise<DriveClient> {
  return { token: await googleAccessToken(), fetch: fetchImpl };
}

export async function findChild(
  client: DriveClient,
  parentId: string,
  name: string,
): Promise<DriveFile | null> {
  const query = [
    `'${escapeDriveQuery(parentId)}' in parents`,
    `name = '${escapeDriveQuery(name)}'`,
    "trashed = false",
  ].join(" and ");
  const url = new URL(`${DRIVE_API}/files`);
  url.searchParams.set("q", query);
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("fields", "files(id,name,mimeType,webViewLink)");
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("includeItemsFromAllDrives", "true");
  const json = await driveJson<{ files?: DriveFile[] }>(client, url.toString());
  return json.files?.[0] ?? null;
}

export async function findCatalogSheet(client: DriveClient, parentId: string) {
  return (
    (await findChild(client, parentId, CATALOG_SHEET_NAME)) ??
    (await findChild(client, parentId, `${CATALOG_SHEET_NAME}.csv`))
  );
}

export async function ensureFolder(client: DriveClient, parentId: string, name: string) {
  const existing = await findChild(client, parentId, name);
  if (existing) return existing;
  return createMetadata(client, {
    name,
    mimeType: FOLDER_MIME,
    parents: [parentId],
  });
}

export async function upsertFile(
  client: DriveClient,
  input: {
    parentId: string;
    name: string;
    bytes: Uint8Array;
    contentType: string;
    existing?: DriveFile | null;
    convertToSheet?: boolean;
  },
): Promise<DriveFile> {
  const existing = input.existing ?? (await findChild(client, input.parentId, input.name));
  if (existing) {
    return uploadMedia(client, existing.id, input.bytes, input.contentType);
  }
  const metadata: Record<string, unknown> = {
    name: input.name,
    parents: [input.parentId],
    mimeType: input.convertToSheet ? SHEET_MIME : input.contentType,
  };
  return uploadMultipart(client, metadata, input.bytes, input.contentType);
}

async function createMetadata(client: DriveClient, metadata: Record<string, unknown>) {
  const url = new URL(`${DRIVE_API}/files`);
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("fields", "id,name,mimeType,webViewLink");
  return driveJson<DriveFile>(client, url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });
}

async function uploadMultipart(
  client: DriveClient,
  metadata: Record<string, unknown>,
  bytes: Uint8Array,
  contentType: string,
) {
  const boundary = `kelvi_${Date.now()}`;
  const head = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`,
  );
  const tail = Buffer.from(`\r\n--${boundary}--`);
  const body = Buffer.concat([head, Buffer.from(bytes), tail]);
  const url = new URL(`${UPLOAD_API}/files`);
  url.searchParams.set("uploadType", "multipart");
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("fields", "id,name,mimeType,webViewLink");
  return driveJson<DriveFile>(client, url.toString(), {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
}

async function uploadMedia(
  client: DriveClient,
  fileId: string,
  bytes: Uint8Array,
  contentType: string,
) {
  const url = new URL(`${UPLOAD_API}/files/${fileId}`);
  url.searchParams.set("uploadType", "media");
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("fields", "id,name,mimeType,webViewLink");
  return driveJson<DriveFile>(client, url.toString(), {
    method: "PATCH",
    headers: { "Content-Type": contentType },
    body: Buffer.from(bytes),
  });
}

export async function driveJson<T>(client: DriveClient, url: string, init?: RequestInit): Promise<T> {
  const response = await client.fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${client.token}`,
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  let json: Record<string, unknown> = {};
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(`Google Drive returned HTTP ${response.status}`);
    }
  }
  if (!response.ok) {
    const err = json.error as { message?: string } | undefined;
    const message = err?.message || `Google Drive HTTP ${response.status}`;
    if (response.status === 404) {
      throw new Error(
        `${message} Share the Drive folder with the service account as Editor.`,
      );
    }
    throw new Error(message);
  }
  return json as T;
}

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
