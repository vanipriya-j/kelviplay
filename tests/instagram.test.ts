import { describe, expect, it } from "vitest";
import { parsePublishAccounts, publishImageToInstagram } from "@/lib/share/instagram";

describe("instagram publish accounts", () => {
  it("parses handle|id|token rows", () => {
    const accounts = parsePublishAccounts(
      "aarla.play|111|token-a, @aarla.kanakangi|222|token-b\naarla.merch|333|token-c",
    );
    expect(accounts.map((row) => row.handle)).toEqual([
      "aarla.play",
      "aarla.kanakangi",
      "aarla.merch",
    ]);
    expect(accounts[0].igUserId).toBe("111");
  });

  it("creates then publishes a container per account", async () => {
    const calls: Array<{ path: string; body: Record<string, string> }> = [];
    const results = await publishImageToInstagram({
      imageUrl: "https://kelviplay.vercel.app/api/share/daily?day=2026-09-16",
      caption: "Today's winners",
      sleepMs: 0,
      accounts: [
        { handle: "aarla.play", igUserId: "111", accessToken: "token-a" },
        { handle: "aarla.kanakangi", igUserId: "222", accessToken: "token-b" },
        { handle: "aarla.merch", igUserId: "333", accessToken: "token-c" },
      ],
      graph: async (path, body) => {
        calls.push({ path, body });
        if (path.endsWith("/media")) return { id: `creation-${body.access_token}` };
        return { id: `media-${body.access_token}` };
      },
    });
    expect(calls).toHaveLength(6);
    expect(results.every((row) => row.ok)).toBe(true);
    expect(results.map((row) => row.handle)).toEqual([
      "aarla.play",
      "aarla.kanakangi",
      "aarla.merch",
    ]);
  });

  it("skips when no accounts are configured", async () => {
    const results = await publishImageToInstagram({
      imageUrl: "https://example.com/card.png",
      caption: "Today's winners",
      accounts: [],
      sleepMs: 0,
    });
    expect(results.every((row) => row.skipped)).toBe(true);
    expect(results.map((row) => row.handle)).toEqual([
      "aarla.play",
      "aarla.kanakangi",
      "aarla.merch",
    ]);
  });
});
