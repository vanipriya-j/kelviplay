import { describe, expect, it } from "vitest";
import { sessionCookieName, sessionCookieNames } from "@/lib/session-cookie";

describe("session cookie name", () => {
  it("uses the Auth.js secure name on Vercel", () => {
    const prev = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      expect(sessionCookieName()).toBe("__Secure-authjs.session-token");
      expect(sessionCookieNames()).toContain("authjs.session-token");
    } finally {
      process.env.VERCEL = prev;
    }
  });
});
