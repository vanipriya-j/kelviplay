import { describe, expect, it } from "vitest";
import { isUnusableOrigin, publicAppUrl } from "@/lib/app-url";

describe("public app url", () => {
  it("rejects localhost and Auth.js API paths", () => {
    expect(isUnusableOrigin("http://localhost:3000")).toBe(true);
    expect(isUnusableOrigin("https://kelviplay.vercel.app/api/auth")).toBe(true);
    expect(isUnusableOrigin("https://kelviplay.vercel.app")).toBe(false);
  });

  it("prefers NEXT_PUBLIC_APP_URL when it is a real origin", () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    const prevAuth = process.env.AUTH_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://kelviplay.vercel.app";
    process.env.AUTH_URL = "http://localhost:3000";
    try {
      expect(publicAppUrl()).toBe("https://kelviplay.vercel.app");
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = prev;
      process.env.AUTH_URL = prevAuth;
    }
  });
});
