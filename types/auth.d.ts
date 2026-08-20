import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      displayName: string;
      isAdmin: boolean;
      isGuest: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    displayName?: string;
    isAdmin?: boolean;
    isGuest?: boolean;
  }
}
