import { IMAGES_FOLDER_NAME, createDriveClient, driveMedia, findChild, listChildren } from "./drive";
import { driveFolderId, isDriveConfigured } from "./google-auth";
import { matchStillName, stillCandidates } from "./stills";

type CachedStill = {
  bytes: Uint8Array;
  contentType: string;
  expiresAt: number;
};

const STILL_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, CachedStill>();
let listing: { parentId: string; files: Awaited<ReturnType<typeof listChildren>>; expiresAt: number } | null =
  null;

export async function loadKelviStill(number: number, side: "question" | "answer") {
  if (!Number.isInteger(number) || number < 1) return null;
  if (side !== "question" && side !== "answer") return null;

  const key = `${number}:${side}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit;
  if (!isDriveConfigured()) return null;

  const client = await createDriveClient();
  const folderId = driveFolderId();
  const images = await findChild(client, folderId, IMAGES_FOLDER_NAME);
  const parentId = images?.id ?? folderId;

  for (const name of stillCandidates(number, side)) {
    const file = await findChild(client, parentId, name);
    if (!file) continue;
    return storeStill(key, await driveMedia(client, file.id));
  }

  const files = await listedStills(client, parentId);
  const match = files.find((file) => matchStillName(file.name, number, side));
  if (!match) return null;
  return storeStill(key, await driveMedia(client, match.id));
}

async function listedStills(client: Parameters<typeof listChildren>[0], parentId: string) {
  const cached = listing;
  if (cached && cached.parentId === parentId && cached.expiresAt > Date.now()) {
    return cached.files;
  }
  const files = await listChildren(client, parentId);
  listing = { parentId, files, expiresAt: Date.now() + STILL_TTL_MS };
  return files;
}

function storeStill(key: string, media: { bytes: Uint8Array; contentType: string }) {
  const stored = { ...media, expiresAt: Date.now() + STILL_TTL_MS };
  cache.set(key, stored);
  return stored;
}
