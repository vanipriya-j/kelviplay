import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import type { NextRequest } from "next/server";
import { prepareAuthEnv } from "./app-url";
import { prisma } from "./db";
import { authSecret, runtimeEnv } from "./runtime-env";
import { sessionFromCookie } from "./session-cookie";
import { publicName } from "./utils";

function guestName() {
  const n = Math.floor(100 + Math.random() * 900);
  return `Guest ${n}`;
}

function createAuthConfig() {
  prepareAuthEnv();
  const demoEnabled =
    runtimeEnv("AUTH_DEMO") === "true" || process.env.NODE_ENV !== "production";

  return {
    secret: authSecret() || undefined,
    trustHost: true as const,
    session: { strategy: "jwt" as const, maxAge: 60 * 60 * 24 * 30 },
    pages: {
      signIn: "/auth",
      error: "/play/kelvi",
    },
    providers: [
      ...(runtimeEnv("GOOGLE_CLIENT_ID") && runtimeEnv("GOOGLE_CLIENT_SECRET")
        ? [
            Google({
              clientId: runtimeEnv("GOOGLE_CLIENT_ID"),
              clientSecret: runtimeEnv("GOOGLE_CLIENT_SECRET"),
            }),
          ]
        : []),
      ...(runtimeEnv("APPLE_ID") && runtimeEnv("APPLE_SECRET")
        ? [
            Apple({
              clientId: runtimeEnv("APPLE_ID"),
              clientSecret: runtimeEnv("APPLE_SECRET"),
            }),
          ]
        : []),
      Credentials({
        id: "kelvi",
        name: "Kelvi",
        credentials: {
          kind: { label: "kind", type: "text" },
          token: { label: "token", type: "text" },
          email: { label: "email", type: "email" },
          displayName: { label: "displayName", type: "text" },
          demoKey: { label: "demoKey", type: "text" },
        },
        async authorize(credentials) {
          try {
            const kind = String(credentials?.kind ?? "");

            if (kind === "guest") {
              const player = await prisma.player.create({
                data: {
                  displayName: guestName(),
                  name: "Guest",
                  isGuest: true,
                },
              });
              return toAuthUser(player);
            }

            if (kind === "magic") {
              const token = String(credentials?.token ?? "");
              const link = await prisma.magicLink.findUnique({ where: { token } });
              if (!link || link.consumedAt || link.expiresAt < new Date()) {
                return null;
              }
              const displayName =
                (credentials?.displayName
                  ? String(credentials.displayName)
                  : link.displayName) || link.email.split("@")[0];
              const existing = await prisma.player.findUnique({
                where: { email: link.email },
              });
              const player =
                existing ??
                (await prisma.player.create({
                  data: {
                    email: link.email,
                    emailVerified: new Date(),
                    displayName: publicName(displayName, "Player"),
                    name: displayName,
                    isGuest: false,
                  },
                }));
              if (existing?.isGuest) {
                await prisma.player.update({
                  where: { id: existing.id },
                  data: { isGuest: false, emailVerified: new Date() },
                });
              }
              await prisma.magicLink.update({
                where: { id: link.id },
                data: { consumedAt: new Date(), playerId: player.id },
              });
              return toAuthUser({ ...player, isGuest: false });
            }

            if (kind === "demo" && demoEnabled) {
              const demoKey = String(credentials?.demoKey ?? "");
              const player = await prisma.player.findFirst({
                where:
                  demoKey === "admin"
                    ? { isAdmin: true }
                    : { displayName: demoKey, isGuest: false },
              });
              return player ? toAuthUser(player) : null;
            }

            return null;
          } catch (error) {
            console.error("[kelvi] sign-in failed", error);
            return null;
          }
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user, account, profile }) {
        if (account?.provider === "google" && profile && "email" in profile && profile.email) {
          const email = String(profile.email);
          const picture = "picture" in profile ? String(profile.picture ?? "") : "";
          const name = "name" in profile ? String(profile.name ?? email.split("@")[0]) : email;
          try {
            const player = await prisma.player.upsert({
              where: { email },
              update: {
                emailVerified: new Date(),
                image: picture || undefined,
                isGuest: false,
              },
              create: {
                email,
                emailVerified: new Date(),
                displayName: publicName(name, "Player"),
                name,
                image: picture || null,
                isGuest: false,
              },
            });
            token.userId = player.id;
            token.displayName = player.displayName;
            token.isAdmin = player.isAdmin;
            token.isGuest = player.isGuest;
            token.email = player.email;
            token.picture = player.image;
          } catch (error) {
            console.error("[kelvi] google jwt upsert failed", error);
          }
          return token;
        }

        if (user && "id" in user) {
          token.userId = user.id as string;
          token.displayName = (user as { displayName?: string }).displayName ?? user.name ?? "Player";
          token.isAdmin = Boolean((user as { isAdmin?: boolean }).isAdmin);
          token.isGuest = Boolean((user as { isGuest?: boolean }).isGuest);
          token.email = user.email;
          token.picture = user.image;
        }
        return token;
      },
      async session({ session, token }) {
        session.user = {
          ...session.user,
          id: String(token.userId ?? ""),
          displayName: String(token.displayName ?? session.user?.name ?? "Player"),
          isAdmin: Boolean(token.isAdmin),
          isGuest: Boolean(token.isGuest),
          email: (token.email as string | null) ?? session.user?.email ?? null,
          image: (token.picture as string | null) ?? session.user?.image ?? null,
        };
        return session;
      },
    },
  } satisfies NextAuthConfig;
}

const nextAuth = NextAuth(createAuthConfig);

function isSessionRequest(req: Request) {
  try {
    const { pathname } = new URL(req.url);
    return pathname.endsWith("/session");
  } catch {
    return false;
  }
}

export const { signIn, signOut } = nextAuth;

export const handlers = {
  async GET(req: NextRequest) {
    prepareAuthEnv();
    const res = await nextAuth.handlers.GET(req);
    if (res.status !== 500) return res;
    if (isSessionRequest(req)) {
      const session = await sessionFromCookie();
      return Response.json(session ?? {});
    }
    console.error("[kelvi] Auth.js GET 500", { hasSecret: Boolean(authSecret()) });
    return res;
  },
  async POST(req: NextRequest) {
    prepareAuthEnv();
    return nextAuth.handlers.POST(req);
  },
};

export async function auth() {
  try {
    const session = await nextAuth.auth();
    if (session?.user?.id) return session;
  } catch (error) {
    console.error("[kelvi] auth() failed", error);
  }
  return sessionFromCookie();
}

function toAuthUser(player: {
  id: string;
  displayName: string;
  email: string | null;
  image: string | null;
  isAdmin: boolean;
  isGuest: boolean;
}) {
  return {
    id: player.id,
    name: player.displayName,
    email: player.email,
    image: player.image,
    displayName: player.displayName,
    isAdmin: player.isAdmin,
    isGuest: player.isGuest,
  };
}

export async function getSessionPlayer() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.player.findUnique({ where: { id: session.user.id } });
}

export async function requirePlayer() {
  const player = await getSessionPlayer();
  if (!player) {
    throw new Error("UNAUTHENTICATED");
  }
  return player;
}
