import { decode, encode } from "@auth/core/jwt";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { authSecret } from "./runtime-env";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function guestName() {
  const n = Math.floor(100 + Math.random() * 900);
  return `Guest ${n}`;
}

export function sessionCookieName() {
  const secure = process.env["VERCEL"] === "1" || process.env.NODE_ENV === "production";
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

export function sessionCookieNames() {
  return [...new Set([sessionCookieName(), "__Secure-authjs.session-token", "authjs.session-token"])];
}

export async function clearSessionCookies() {
  const store = await cookies();
  for (const name of sessionCookieNames()) {
    store.delete(name);
  }
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
  const secret = authSecret();
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

export async function readSessionToken() {
  const secret = authSecret();
  if (!secret) return null;
  const store = await cookies();
  for (const name of sessionCookieNames()) {
    const value = store.get(name)?.value;
    if (!value) continue;
    try {
      const token = await decode({ token: value, secret, salt: name });
      if (token) return token;
    } catch (error) {
      console.error("[kelvi] session cookie decode failed", name, error);
    }
  }
  return null;
}

export async function sessionFromCookie() {
  const token = await readSessionToken();
  const userId = token ? String(token.userId ?? token.sub ?? "") : "";
  if (!userId) return null;
  const expires = token?.exp
    ? new Date(Number(token.exp) * 1000).toISOString()
    : new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
  return {
    user: {
      id: userId,
      name: String(token?.displayName ?? "Player"),
      email: (token?.email as string | null | undefined) ?? null,
      image: (token?.picture as string | null | undefined) ?? null,
      displayName: String(token?.displayName ?? "Player"),
      isAdmin: Boolean(token?.isAdmin),
      isGuest: Boolean(token?.isGuest),
    },
    expires,
  };
}

export async function ensureGuestPlayerId(existingId?: string | null) {
  if (existingId) return existingId;
  const fromCookie = await sessionFromCookie();
  if (fromCookie?.user.id) return fromCookie.user.id;
  const player = await createGuestPlayer();
  await setPlayerSessionCookie(player);
  return player.id;
}
