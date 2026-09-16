import { AARLA_HANDLES } from "../game/rhythm";
import { runtimeEnv } from "../runtime-env";

export type InstagramPublishAccount = {
  handle: string;
  igUserId: string;
  accessToken: string;
};

export type InstagramPublishResult = {
  handle: string;
  igUserId: string;
  ok: boolean;
  skipped?: boolean;
  mediaId?: string;
  error?: string;
};

type GraphClient = (path: string, body: Record<string, string>) => Promise<Record<string, unknown>>;

const DEFAULT_GRAPH_HOST = "https://graph.facebook.com";
const DEFAULT_GRAPH_VERSION = "v21.0";

export function parsePublishAccounts(
  raw = runtimeEnv("INSTAGRAM_PUBLISH_ACCOUNTS"),
): InstagramPublishAccount[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as Array<Record<string, string>>;
      return parsed
        .map((row) => ({
          handle: normalizeHandle(row.handle ?? row.username ?? ""),
          igUserId: String(row.igUserId ?? row.id ?? "").trim(),
          accessToken: String(row.accessToken ?? row.token ?? "").trim(),
        }))
        .filter((row) => row.handle && row.igUserId && row.accessToken);
    } catch {
      return [];
    }
  }

  return trimmed
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [handle, igUserId, ...tokenParts] = entry.split("|");
      return {
        handle: normalizeHandle(handle ?? ""),
        igUserId: (igUserId ?? "").trim(),
        accessToken: tokenParts.join("|").trim(),
      };
    })
    .filter((row) => row.handle && row.igUserId && row.accessToken);
}

export function configuredPublishHandles() {
  const parsed = parsePublishAccounts().map((row) => row.handle);
  return parsed.length ? parsed : [...AARLA_HANDLES];
}

export function graphEndpoint() {
  const host = (runtimeEnv("INSTAGRAM_GRAPH_HOST") || DEFAULT_GRAPH_HOST).replace(/\/$/, "");
  const version = runtimeEnv("INSTAGRAM_GRAPH_VERSION") || DEFAULT_GRAPH_VERSION;
  return `${host}/${version}`;
}

export async function publishImageToInstagram(input: {
  imageUrl: string;
  caption: string;
  accounts?: InstagramPublishAccount[];
  graph?: GraphClient;
  sleepMs?: number;
}): Promise<InstagramPublishResult[]> {
  const accounts = input.accounts ?? parsePublishAccounts();
  if (!accounts.length) {
    return AARLA_HANDLES.map((handle) => ({
      handle,
      igUserId: "",
      ok: false,
      skipped: true,
      error: "INSTAGRAM_PUBLISH_ACCOUNTS is not set",
    }));
  }

  const graph = input.graph ?? defaultGraphClient;
  const wait = input.sleepMs ?? 1500;
  const results: InstagramPublishResult[] = [];

  for (const account of accounts) {
    try {
      const created = await graph(`${account.igUserId}/media`, {
        image_url: input.imageUrl,
        caption: input.caption,
        access_token: account.accessToken,
      });
      const creationId = typeof created.id === "string" ? created.id : "";
      if (!creationId) {
        results.push({
          handle: account.handle,
          igUserId: account.igUserId,
          ok: false,
          error: graphError(created) || "Instagram did not return a creation id",
        });
        continue;
      }
      if (wait > 0) await sleep(wait);
      const published = await graph(`${account.igUserId}/media_publish`, {
        creation_id: creationId,
        access_token: account.accessToken,
      });
      const mediaId = typeof published.id === "string" ? published.id : creationId;
      if (published.error) {
        results.push({
          handle: account.handle,
          igUserId: account.igUserId,
          ok: false,
          error: graphError(published),
        });
        continue;
      }
      results.push({
        handle: account.handle,
        igUserId: account.igUserId,
        ok: true,
        mediaId,
      });
    } catch (error) {
      results.push({
        handle: account.handle,
        igUserId: account.igUserId,
        ok: false,
        error: error instanceof Error ? error.message : "Instagram publish failed",
      });
    }
  }

  return results;
}

async function defaultGraphClient(path: string, body: Record<string, string>) {
  const response = await fetch(`${graphEndpoint()}/${path.replace(/^\//, "")}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok && !json.error) {
    json.error = { message: `Instagram HTTP ${response.status}` };
  }
  return json;
}

function graphError(payload: Record<string, unknown>) {
  const error = payload.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

function normalizeHandle(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
