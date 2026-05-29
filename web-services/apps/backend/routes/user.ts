import { Router } from "express";
import { SignInSchema, SignUpSchema } from "@Axion/types";
import prisma from "@axion/db";
import { authMiddleware } from "@axion/utilities/auth";
import {
  fail,
  getUserOr404,
  ok,
  signToken,
  TWELVE_HOURS_MS,
} from "../utils/helpers";

const UserRouter = Router();

UserRouter.post("/signup", async (req, res) => {
  const parsedBody = SignUpSchema.safeParse(req.body);
  if (!parsedBody.success) {
    fail(res, 400, "Invalid request body");
    return;
  }
  try {
    const { email, publicKey, name } = parsedBody.data;
    const existingUser = await prisma.user.findUnique({ where: { publicKey } });
    const user =
      existingUser ??
      (await prisma.user.create({ data: { email, publicKey, name } }));
    ok(res, {
      message: "User signed up successfully",
      token: signToken({ userId: user.id }, "1Day"),
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      const user = await prisma.user.findUnique({
        where: { publicKey: parsedBody.data.publicKey },
      });
      if (user) {
        ok(res, {
          message: "User signed up successfully",
          token: signToken({ userId: user.id }, "1Day"),
        });
        return;
      }
    }
    console.error("Error during signup:", error);
    fail(res, 500, "Internal server error");
  }
});

UserRouter.post("/login", async (req, res) => {
  const parsedBody = SignInSchema.safeParse(req.body);
  if (!parsedBody.success) {
    fail(res, 400, "Invalid request body");
    return;
  }
  try {
    const { email, publicKey } = parsedBody.data;
    const user = await prisma.user.findFirst({ where: { email, publicKey } });
    if (!user) {
      fail(res, 404, "User not found");
      return;
    }
    ok(res, {
      message: "User logged in successfully",
      token: signToken({ userId: user.id }, "1Day"),
    });
  } catch (error) {
    console.error("Error during login:", error);
    fail(res, 500, "Internal server error");
  }
});

UserRouter.get("/me", authMiddleware, async (req, res) => {
  const user = await getUserOr404(res, req.userId);
  if (!user) return;
  ok(res, {
    id: user.id,
    email: user.email,
    publicKey: user.publicKey,
    name: user.name,
  });
});

UserRouter.get("/checkTimeout", authMiddleware, async (req, res) => {
  const user = await getUserOr404(res, req.userId);
  if (!user) return;
  if (user.timeoutAt) {
    const elapsed = Date.now() - new Date(user.timeoutAt).getTime();
    if (elapsed < TWELVE_HOURS_MS) {
      fail(res, 403, "You can only create a VM once every 12 hours");
      return;
    }
  }
  ok(res, { message: "User can create a VM" });
});

export default UserRouter;
