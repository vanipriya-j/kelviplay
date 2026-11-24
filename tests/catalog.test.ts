import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { findChild, upsertFile, type DriveClient } from "@/lib/catalog/drive";
import { isDriveConfigured, readServiceAccount, serviceAccountEmail } from "@/lib/catalog/google-auth";
import { catalogCsv, listCatalogRows } from "@/lib/catalog/rows";
import { answerStillFile, questionStillFile, STILL_ART } from "@/lib/catalog/stills";
import { syncCatalogToDrive } from "@/lib/catalog/sync";

function mockQuestion(overrides: Record<string, unknown> = {}) {
  return {
    number: 170,
    internalTitle: "Filter coffee",
    questionText: 'What is filter coffee served in, "davara"?',
    questionType: "TEXT",
    difficulty: "EASY",
    correctAnswer: "davara",
    acceptableAnswers: ["dabarah", "tumbler"],
    mediaUrl: null,
    status: "SCHEDULED",
    releaseAt: new Date("2026-09-16T00:30:00.000Z"),
    expireAt: new Date("2026-09-16T02:30:00.000Z"),
    category: { name: "Food" },
    options: [],
    ...overrides,
  };
}

describe("catalog listing", () => {
  it("names question and answer stills separately", () => {
    expect(questionStillFile(7)).toBe("kelvi-0007-question.png");
    expect(answerStillFile(194)).toBe("kelvi-0194-answer.png");
  });

  it("lists every Kelvi and puts answers only in the admin CSV", async () => {
    const db = {
      question: {
        findMany: async () => [mockQuestion(), mockQuestion({ number: 171, internalTitle: "Kanjira" })],
      },
    } as unknown as PrismaClient;

    const rows = await listCatalogRows(db);
    expect(rows).toHaveLength(2);
    expect(rows[0].questionImage).toBe("kelvi-0170-question.png");
    expect(rows[0].answerImage).toBe("kelvi-0170-answer.png");
    expect(rows[0].answer).toBe("davara");
    expect(rows[0].releaseAtIst).toBe("2026-09-16T06:00");

    const csv = catalogCsv(rows);
    expect(csv.startsWith("number,title,question,")).toBe(true);
    expect(csv).toContain("questionImage,answerImage");
    expect(csv).toContain("davara");
    expect(csv).toContain('"What is filter coffee served in, ""davara""?"');
  });

  it("treats stills as art, not printed copy", () => {
    expect(STILL_ART.forbidden.some((rule) => rule.toLowerCase().includes("print the question"))).toBe(
      true,
    );
    expect(STILL_ART.forbidden.some((rule) => rule.toLowerCase().includes("print the answer"))).toBe(
      true,
    );
  });
});

describe("drive auth", () => {
  it("reads a service account JSON blob", () => {
    const prevJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const prevFolder = process.env.GOOGLE_DRIVE_FOLDER_ID;
    process.env.GOOGLE_DRIVE_FOLDER_ID = "folder-1";
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: "kelvi-catalog@aarla.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n",
    });
    try {
      expect(isDriveConfigured()).toBe(true);
      expect(serviceAccountEmail()).toBe("kelvi-catalog@aarla.iam.gserviceaccount.com");
      expect(readServiceAccount()?.private_key).toContain("BEGIN PRIVATE KEY");
      expect(readServiceAccount()?.private_key).toContain("\n");
    } finally {
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON = prevJson;
      process.env.GOOGLE_DRIVE_FOLDER_ID = prevFolder;
    }
  });
});

describe("drive upsert", () => {
  it("creates a new file then patches when the name already exists", async () => {
    const calls: Array<{ url: string; method: string }> = [];
    const files = new Map<string, { id: string; name: string }>();

    const client: DriveClient = {
      token: "token",
      fetch: async (input, init) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();
        calls.push({ url, method });
        if (url.includes("/upload/") && method === "POST") {
          files.set("kelvi-0170-question.png", { id: "img-1", name: "kelvi-0170-question.png" });
          return jsonResponse({
            id: "img-1",
            name: "kelvi-0170-question.png",
            mimeType: "image/png",
            webViewLink: "https://drive.google.com/file/d/img-1/view",
          });
        }
        if (url.includes("/upload/") && method === "PATCH") {
          return jsonResponse({
            id: "img-1",
            name: "kelvi-0170-question.png",
            mimeType: "image/png",
          });
        }
        if (url.includes("/files") && method === "GET") {
          const found = [...files.values()][0];
          return jsonResponse({ files: found ? [{ ...found, mimeType: "image/png" }] : [] });
        }
        return jsonResponse({ error: { message: `unexpected ${method} ${url}` } }, 500);
      },
    };

    const created = await upsertFile(client, {
      parentId: "folder-1",
      name: "kelvi-0170-question.png",
      bytes: new Uint8Array([1, 2, 3]),
      contentType: "image/png",
    });
    expect(created.id).toBe("img-1");

    const updated = await upsertFile(client, {
      parentId: "folder-1",
      name: "kelvi-0170-question.png",
      bytes: new Uint8Array([4, 5, 6]),
      contentType: "image/png",
    });
    expect(updated.id).toBe("img-1");
    expect(calls.some((call) => call.method === "PATCH")).toBe(true);
  });

  it("escapes quotes when looking up a file name", async () => {
    let query = "";
    const client: DriveClient = {
      token: "token",
      fetch: async (input) => {
        query = new URL(String(input)).searchParams.get("q") ?? "";
        return jsonResponse({ files: [] });
      },
    };
    await findChild(client, "folder-1", "O'Brien");
    expect(query).toContain("name = 'O\\'Brien'");
  });
});

describe("catalog sync", () => {
  it("writes the sheet and does not upload generated type cards", async () => {
    const prevFolder = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const prevJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    process.env.GOOGLE_DRIVE_FOLDER_ID = "folder-1";
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: "kelvi-catalog@aarla.iam.gserviceaccount.com",
      private_key: "key",
    });

    const uploaded: string[] = [];
    const client: DriveClient = {
      token: "token",
      fetch: async (input, init) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();
        if (method === "GET") {
          const query = new URL(url).searchParams.get("q") ?? "";
          if (query.includes("name = 'images'")) {
            return jsonResponse({
              files: [{ id: "images-1", name: "images", mimeType: "application/vnd.google-apps.folder" }],
            });
          }
          return jsonResponse({ files: [] });
        }
        if (url.includes("/upload/") && method === "POST") {
          const name = uploadedName(init?.body);
          uploaded.push(name);
          return jsonResponse({
            id: `file-${uploaded.length}`,
            name,
            mimeType: "application/octet-stream",
            webViewLink: `https://drive.google.com/file/d/file-${uploaded.length}/view`,
          });
        }
        if (method === "POST" && url.includes("/files")) {
          return jsonResponse({
            id: "images-1",
            name: "images",
            mimeType: "application/vnd.google-apps.folder",
          });
        }
        return jsonResponse({ error: { message: `unexpected ${method}` } }, 500);
      },
    };

    const db = {
      question: {
        findMany: async () => [
          mockQuestion({ number: 170 }),
          mockQuestion({ number: 171, internalTitle: "Kanjira" }),
        ],
      },
    } as unknown as PrismaClient;

    try {
      const result = await syncCatalogToDrive(db, { drive: client });
      expect(result.rows).toBe(2);
      expect(result.uploaded).toEqual([]);
      expect(result.nextNumber).toBeNull();
      expect(uploaded).toEqual(["Kelvi catalog"]);
      expect(result.folderUrl).toContain("folder-1");
    } finally {
      process.env.GOOGLE_DRIVE_FOLDER_ID = prevFolder;
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON = prevJson;
    }
  });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function uploadedName(body: unknown) {
  const text = Buffer.isBuffer(body)
    ? body.toString("utf8")
    : typeof body === "string"
      ? body
      : "";
  const match = text.match(/"name":"([^"]+)"/);
  return match?.[1] ?? "created";
}
