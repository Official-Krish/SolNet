import type { ServerWebSocket } from "bun";
import jwt, { type JwtPayload } from "jsonwebtoken";
import prisma from "@axion/db";
import { createQueue } from "@axion/utilities/redis";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const HEARTBEAT_TIMEOUT_MS = 90_000; // 3 missed heartbeats (30s each)
const HEARTBEAT_CHECK_INTERVAL_MS = 30_000;

// --- Queues ---
const penalizeQueue = createQueue("penalize-host");
const activateHostQueue = createQueue("changeVMStatus");

// --- Connection State ---
interface HostConnection {
  ws: ServerWebSocket<unknown>;
  machineId: string;
  userPublicKey: string;
  lastHeartbeat: number;
}

const activeConnections = new Map<string, HostConnection>();

// --- Heartbeat Checker ---
setInterval(() => {
  const now = Date.now();
  for (const [id, conn] of activeConnections) {
    if (now - conn.lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
      console.log(`[heartbeat] Host ${id} timed out, penalizing...`);
      handleHostTimeout(id, conn);
    }
  }
}, HEARTBEAT_CHECK_INTERVAL_MS);

async function handleHostTimeout(machineId: string, conn: HostConnection) {
  activeConnections.delete(machineId);
  try {
    await prisma.depinHostMachine.update({
      where: { id: machineId },
      data: { isActive: false },
    });
    await penalizeQueue.add("penalize-host", {
      id: machineId,
      userPubKey: conn.userPublicKey,
    });
    conn.ws.close(4001, "Heartbeat timeout");
  } catch (err) {
    console.error(`[heartbeat] Error penalizing ${machineId}:`, err);
  }
}

// --- Message Types ---
interface WsMessage {
  type:
    | "SUBSCRIBE"
    | "UNSUBSCRIBE"
    | "heartbeat"
    | "start-job"
    | "end-job"
    | "job-status"
    | "status";
  jobId?: string;
  machineId?: string;
  token?: string;
  dockerImage?: string;
  ports?: number[];
  env?: Record<string, string>;
  status?: string;
}

// --- WebSocket Server ---
Bun.serve({
  port: 8080,
  fetch(req, server) {
    if (server.upgrade(req)) return;
    return new Response("Upgrade failed", { status: 500 });
  },
  websocket: {
    async message(ws, raw) {
      try {
        const data: WsMessage = JSON.parse(raw.toString());

        switch (data.type) {
          case "SUBSCRIBE":
            await handleSubscribe(ws, data);
            break;
          case "UNSUBSCRIBE":
            await handleUnsubscribe(data);
            break;
          case "heartbeat":
            handleHeartbeat(data);
            break;
          case "start-job":
            handleStartJob(ws, data);
            break;
          case "end-job":
            handleEndJob(ws, data);
            break;
          case "status":
            await handleStatus(data);
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("[ws] Error:", err);
        ws.send(JSON.stringify({ type: "error", message: "Internal error" }));
      }
    },
    open(ws) {
      ws.send(
        JSON.stringify({
          type: "connected",
          message: "Connected to DePIN WS Relayer",
        }),
      );
    },
    close(ws) {
      // Find and remove disconnected host
      for (const [id, conn] of activeConnections) {
        if (conn.ws === ws) {
          activeConnections.delete(id);
          prisma.depinHostMachine
            .update({ where: { id }, data: { isActive: false } })
            .catch((err) =>
              console.error(`[close] Error deactivating ${id}:`, err),
            );
          console.log(`[close] Host ${id} disconnected`);
          break;
        }
      }
    },
  },
});

console.log("[depin-ws-relayer] Running on port 8080");

// --- Handlers ---

async function handleSubscribe(ws: ServerWebSocket<unknown>, data: WsMessage) {
  const payload = verifyHostToken(data.token || "");
  if (!payload) {
    ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
    ws.close(4000, "Invalid token");
    return;
  }

  const { id, userPublicKey } = payload;

  activeConnections.set(id, {
    ws,
    machineId: id,
    userPublicKey,
    lastHeartbeat: Date.now(),
  });

  await prisma.depinHostMachine.update({
    where: { id },
    data: { isActive: true },
  });

  console.log(`[subscribe] Host ${id} connected`);
  ws.send(JSON.stringify({ type: "subscribed", machineId: id }));
}

async function handleUnsubscribe(data: WsMessage) {
  const payload = verifyHostToken(data.token || "");
  if (!payload) return;

  const conn = activeConnections.get(payload.id);
  if (conn) {
    activeConnections.delete(payload.id);
    await prisma.depinHostMachine.update({
      where: { id: payload.id },
      data: { isActive: false },
    });
    await activateHostQueue.add("changeVMStatus", {
      id: payload.id,
      userPubKey: payload.userPublicKey,
      status: false,
    });
    console.log(`[unsubscribe] Host ${payload.id} unsubscribed`);
  }
}

function handleHeartbeat(data: WsMessage) {
  const machineId = data.machineId;
  if (!machineId) return;

  const conn = activeConnections.get(machineId);
  if (conn) {
    conn.lastHeartbeat = Date.now();
    prisma.depinHostMachine
      .update({
        where: { id: machineId },
        data: { lastHeartbeat: new Date() },
      })
      .catch(() => {});
  }
}

function handleStartJob(ws: ServerWebSocket<unknown>, data: WsMessage) {
  if (!verifyUserToken(data.token || "")) {
    ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
    return;
  }

  const hostConn = activeConnections.get(data.machineId || "");
  if (!hostConn) {
    ws.send(JSON.stringify({ type: "error", message: "Host not connected" }));
    return;
  }

  hostConn.ws.send(
    JSON.stringify({
      type: "start-job",
      jobId: data.jobId,
      dockerImage: data.dockerImage,
      ports: data.ports,
      env: data.env,
    }),
  );
}

function handleEndJob(ws: ServerWebSocket<unknown>, data: WsMessage) {
  if (!verifyUserToken(data.token || "")) {
    ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
    return;
  }

  const hostConn = activeConnections.get(data.machineId || "");
  if (!hostConn) {
    ws.send(JSON.stringify({ type: "error", message: "Host not connected" }));
    return;
  }

  hostConn.ws.send(
    JSON.stringify({
      type: "end-job",
      jobId: data.jobId,
    }),
  );
}

async function handleStatus(data: WsMessage) {
  if (!data.jobId || !data.status) return;

  try {
    await prisma.vMInstance.update({
      where: { id: data.jobId },
      data: { status: data.status },
    });
  } catch (err) {
    console.error(`[status] Error updating job ${data.jobId}:`, err);
  }
}

// --- Token Helpers ---

function verifyHostToken(
  token: string,
): { id: string; userPublicKey: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded?.id || !decoded?.userPublicKey) return null;
    return { id: decoded.id, userPublicKey: decoded.userPublicKey };
  } catch {
    return null;
  }
}

function verifyUserToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return !!(decoded?.id && decoded?.machineId);
  } catch {
    return false;
  }
}
