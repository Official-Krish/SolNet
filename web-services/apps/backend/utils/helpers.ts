import type { Response } from "express";
import type { SignOptions } from "jsonwebtoken";
import prisma from "@axion/db";
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "secret123";
export const MINUTE_MS = 60 * 1000;
export const TWELVE_HOURS_MS = 12 * 60 * MINUTE_MS;

export function ok(res: Response, data: unknown, status = 200) {
  res.status(status).json(data);
}

export function fail(res: Response, status: number, msg: string) {
  res.status(status).json({ error: msg });
}

export async function getUserOr404(res: Response, userId?: string) {
  if (!userId) {
    fail(res, 400, "User ID is required");
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    fail(res, 404, "User not found");
    return null;
  }
  return user;
}

export function signToken(
  payload: Record<string, string>,
  expiresIn?: string | number,
) {
  const options: SignOptions | undefined =
    expiresIn !== undefined
      ? { expiresIn: expiresIn as SignOptions["expiresIn"] }
      : undefined;
  return jwt.sign(payload, JWT_SECRET, options);
}
