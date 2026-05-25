import { Router } from "express";
import { SignInSchema, SignUpSchema } from "@decloud/types";
import prisma from "@decloud/db";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../utils/middleware";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

const UserRouter = Router();

UserRouter.post("/signup", async (req, res) => {
  const parsedBody = SignUpSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      error: "Invalid request body",
    });
    return;
  }
  try {
    const { email, publicKey, name } = parsedBody.data;

    const user = await prisma.user.create({
      data: {
        email,
        publicKey,
        name,
      },
    });

    res.status(200).json({
      message: "User signed up successfully",
      token: jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || "secret123",
        {
          expiresIn: "1Day",
        },
      ),
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

UserRouter.post("/login", async (req, res) => {
  const parsedBody = SignInSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      error: "Invalid request body",
    });
    return;
  }
  try {
    const { email, publicKey } = parsedBody.data;
    const user = await prisma.user.findFirst({
      where: {
        email,
        publicKey,
      },
    });
    if (!user) {
      res.status(404).json({
        error: "User not found",
      });
      return;
    }
    res.status(200).json({
      message: "User logged in successfully",
      token: jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || "secret123",
        {
          expiresIn: "1Day",
        },
      ),
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

UserRouter.get("/me", async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({
      error: "User ID is required",
    });
    return;
  }
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      res.status(404).json({
        error: "User not found",
      });
      return;
    }
    res.status(200).json({
      message: "User retrieved successfully",
      json: {
        id: user.id,
        email: user.email,
        publicKey: user.publicKey,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

UserRouter.get("/checkTimeout", authMiddleware, async (req, res) => {
  const userId = req.userId;
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (!user) {
      res.status(404).json({
        error: "User not found",
      });
      return;
    }
    if (user.timeoutAt) {
      const userTimeout =
        new Date().getTime() - new Date(user.timeoutAt).getTime();
      if (userTimeout < TWELVE_HOURS_MS) {
        res.status(200).json({
          error: "You can only create a VM once every 12 hours",
        });
        return;
      }
    }
    res.status(200).json({
      message: "User can create a VM",
    });
  } catch (error) {
    console.error("Error checking user timeout:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default UserRouter;
