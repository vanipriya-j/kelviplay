import { describe, expect, it } from "vitest";
import { authSecret, runtimeEnv } from "@/lib/runtime-env";

describe("runtime env", () => {
  it("reads AUTH_SECRET through a dynamic key so it cannot be inlined empty", () => {
    const prev = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "  runtime-secret  ";
    try {
      expect(runtimeEnv("AUTH_SECRET")).toBe("runtime-secret");
      expect(authSecret()).toBe("runtime-secret");
    } finally {
      process.env.AUTH_SECRET = prev;
    }
  });

  it("falls back to NEXTAUTH_SECRET", () => {
    const prevAuth = process.env.AUTH_SECRET;
    const prevNext = process.env.NEXTAUTH_SECRET;
    delete process.env.AUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "legacy-secret";
    try {
      expect(authSecret()).toBe("legacy-secret");
    } finally {
      process.env.AUTH_SECRET = prevAuth;
      process.env.NEXTAUTH_SECRET = prevNext;
    }
  });

  it("falls back to SETUP_SECRET and copies it onto AUTH_SECRET", () => {
    const prevAuth = process.env.AUTH_SECRET;
    const prevNext = process.env.NEXTAUTH_SECRET;
    const prevSetup = process.env.SETUP_SECRET;
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    process.env.SETUP_SECRET = "setup-only-secret";
    try {
      expect(authSecret()).toBe("setup-only-secret");
      expect(process.env.AUTH_SECRET).toBe("setup-only-secret");
    } finally {
      process.env.AUTH_SECRET = prevAuth;
      process.env.NEXTAUTH_SECRET = prevNext;
      process.env.SETUP_SECRET = prevSetup;
    }
  });
});
