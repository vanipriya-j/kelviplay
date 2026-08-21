import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { prisma } from "./db";
import { publicName } from "./utils";

const demoEnabled =
  process.env.AUTH_DEMO === "true" || process.env.NODE_ENV !== "production";

function guestName() {
  const n = Math.floor(100 + Math.random() * 900);
  return `Guest ${n}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.APPLE_ID && process.env.APPLE_SECRET
      ? [
          Apple({
            clientId: process.env.APPLE_ID,
            clientSecret: process.env.APPLE_SECRET,
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
});

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
