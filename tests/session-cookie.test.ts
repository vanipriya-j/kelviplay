import { describe, expect, it } from "vitest";
import { sessionCookieName } from "@/lib/session-cookie";

describe("session cookie name", () => {
  it("uses the Auth.js secure name on Vercel", () => {
    const prev = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      expect(sessionCookieName()).toBe("__Secure-authjs.session-token");
    } finally {
      process.env.VERCEL = prev;
    }
  });
});
