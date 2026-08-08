import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  getAuthSecret,
} from "./auth-constants";

export type SessionUser = {
  userId: number;
  username: string;
  displayName: string;
};

type SessionPayload = {
  userId: number;
  username: string;
  displayName: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    userId: user.userId,
    username: user.username,
    displayName: user.displayName,
  } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecret());
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export async function getSessionFromRequest(
  req: Request
): Promise<SessionUser | null> {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const userId = Number(payload.userId);
    const username = String(payload.username || "");
    const displayName = String(payload.displayName || username);
    if (!userId || !username) return null;
    return { userId, username, displayName };
  } catch {
    return null;
  }
}

export async function getCurrentUser(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
