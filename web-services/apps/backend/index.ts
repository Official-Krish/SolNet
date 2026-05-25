import express from "express";
import cors from "cors";
import type { NextFunction, Request, Response } from "express";
import UserRouter from "./routes/user";
import vmInstance from "./routes/vmInstance";
import vm from "./routes/vm";
import depinVM from "./routes/depinVm";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/v2/user", UserRouter);
app.use("/api/v2/vmInstance", vmInstance);
app.use("/api/v2/vm", vm);
app.use("/api/v2/user/depin", depinVM);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(3000, () => {
  console.log("Backend server is running on http://localhost:3000");
});
