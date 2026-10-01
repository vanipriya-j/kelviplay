import { createSign } from "crypto";
import { runtimeEnv } from "../runtime-env";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

export function driveFolderId() {
  return runtimeEnv("GOOGLE_DRIVE_FOLDER_ID");
}

export function readServiceAccount(): ServiceAccount | null {
  const raw = runtimeEnv("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ServiceAccount;
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch {
      return null;
    }
  }
  const email = runtimeEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const key = runtimeEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n");
  if (email && key) return { client_email: email, private_key: key };
  return null;
}

export function isDriveConfigured() {
  return Boolean(driveFolderId() && readServiceAccount());
}

export function serviceAccountEmail() {
  return readServiceAccount()?.client_email ?? "";
}

export async function googleAccessToken(account = readServiceAccount()) {
  if (!account) throw new Error("Google service account is not configured.");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url({ alg: "RS256", typ: "JWT" });
  const claim = b64url({
    iss: account.client_email,
    scope: DRIVE_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  });
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const jwt = `${unsigned}.${signer.sign(account.private_key, "base64url")}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const json = (await response.json()) as { access_token?: string; error?: string };
  if (!response.ok || !json.access_token) {
    throw new Error(json.error || `Google auth HTTP ${response.status}`);
  }
  return json.access_token;
}

function b64url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}
