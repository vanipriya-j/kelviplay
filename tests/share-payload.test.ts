import { describe, expect, it } from "vitest";
import { assertNoSpoilers, buildShareCard } from "@/lib/share/payload";

describe("share cards", () => {
  it("never includes question or answer fields", () => {
    const card = buildShareCard({
      kelviNumber: 184,
      displayName: "Vani",
      responseMs: 3840,
      rank: 27,
      streak: 14,
    });
    expect(card.headline).toContain("3.84");
    expect(card.cta).toBe("CAN YOU BEAT ME?");
    expect(() => assertNoSpoilers(card)).not.toThrow();
    const json = JSON.stringify(card);
    expect(json.toLowerCase()).not.toContain("questiontext");
    expect(json.toLowerCase()).not.toContain("correctanswer");
  });

  it("builds a fastest fingers card without spoilers", () => {
    const card = buildShareCard({
      variant: "fastest",
      kelviNumber: 184,
      displayName: "Karthik",
      responseMs: 2180,
      rank: 4,
      streak: 9,
      isFastest: true,
    });
    expect(card.headline).toBe("FASTEST FINGERS");
    expect(() => assertNoSpoilers(card)).not.toThrow();
  });

  it("builds a streak card", () => {
    const card = buildShareCard({
      variant: "streak",
      kelviNumber: 184,
      displayName: "Ananya",
      responseMs: null,
      rank: null,
      streak: 30,
    });
    expect(card.headline).toContain("30 KELVIS");
    expect(card.subhead).toContain("30 CORRECT");
  });
});
