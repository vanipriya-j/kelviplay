import { encode } from "@auth/core/jwt";
import { cookies } from "next/headers";
import { prisma } from "./db";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function guestName() {
  const n = Math.floor(100 + Math.random() * 900);
  return `Guest ${n}`;
}

export function sessionCookieName() {
  const secure = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

export async function createGuestPlayer() {
  return prisma.player.create({
    data: {
      displayName: guestName(),
      name: "Guest",
      isGuest: true,
    },
  });
}

export async function setPlayerSessionCookie(player: {
  id: string;
  displayName: string;
  isAdmin: boolean;
  isGuest: boolean;
  email: string | null;
  image: string | null;
}) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is missing");
  }
  const name = sessionCookieName();
  const secure = name.startsWith("__Secure-");
  const token = await encode({
    token: {
      userId: player.id,
      displayName: player.displayName,
      isAdmin: player.isAdmin,
      isGuest: player.isGuest,
      email: player.email ?? undefined,
      picture: player.image ?? undefined,
      sub: player.id,
    },
    secret,
    salt: name,
    maxAge: SESSION_MAX_AGE,
  });
  const store = await cookies();
  store.set(name, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: SESSION_MAX_AGE,
  });
}

export async function ensureGuestPlayerId(existingId?: string | null) {
  if (existingId) return existingId;
  const player = await createGuestPlayer();
  await setPlayerSessionCookie(player);
  return player.id;
}
