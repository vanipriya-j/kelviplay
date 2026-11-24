import { IMAGES_FOLDER_NAME, createDriveClient, driveMedia, findChild } from "./drive";
import { driveFolderId, isDriveConfigured } from "./google-auth";
import { stillCandidates } from "./stills";

type CachedStill = {
  bytes: Uint8Array;
  contentType: string;
  expiresAt: number;
};

const STILL_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, CachedStill>();

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
    const media = await driveMedia(client, file.id);
    const stored = { ...media, expiresAt: Date.now() + STILL_TTL_MS };
    cache.set(key, stored);
    return stored;
  }

  return null;
}
