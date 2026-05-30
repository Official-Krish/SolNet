import { execSync, spawn } from "child_process";
import { loadConfig, WS_ENDPOINT, type AgentConfig } from "../config";

const HEARTBEAT_INTERVAL_MS = 30_000;
const MAX_RECONNECT_DELAY_MS = 60_000;

let activeWs: WebSocket | null = null;

export async function start() {
  try {
    execSync("docker info", { stdio: "ignore" });
  } catch {
    console.error("  Error: Docker is not running.");
    process.exit(1);
  }

  const config = loadConfig();
  console.log(`\n  Axion Host Agent`);
  console.log(`  Host ID: ${config.host_id}\n`);

  let reconnectAttempt = 0;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let shouldRun = true;

  const shutdown = () => {
    shouldRun = false;
    console.log("\n  Shutting down...");
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (activeWs?.readyState === WebSocket.OPEN) {
      activeWs.send(
        JSON.stringify({ type: "UNSUBSCRIBE", token: config.token }),
      );
      activeWs.close();
    }
    stopAllContainers();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  function connect() {
    const ws = new WebSocket(WS_ENDPOINT);
    activeWs = ws;

    ws.addEventListener("open", () => {
      reconnectAttempt = 0;
      console.log("  [ws] Connected");
      ws.send(JSON.stringify({ type: "SUBSCRIBE", token: config.token }));

      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({ type: "heartbeat", machineId: config.host_id }),
          );
        }
      }, HEARTBEAT_INTERVAL_MS);
    });

    ws.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        handleMessage(msg, config);
      } catch {}
    });

    ws.addEventListener("close", () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (!shouldRun) return;
      const delay = Math.min(
        1000 * 2 ** reconnectAttempt,
        MAX_RECONNECT_DELAY_MS,
      );
      reconnectAttempt++;
      console.log(`  [ws] Reconnecting in ${delay / 1000}s...`);
      setTimeout(connect, delay);
    });

    ws.addEventListener("error", (event) => {
      console.error(
        "  [ws] Error:",
        (event as ErrorEvent).message || "connection failed",
      );
    });
  }

  connect();
}

// --- Handlers ---

function handleMessage(msg: any, config: AgentConfig) {
  switch (msg.type) {
    case "subscribed":
      console.log("  [ws] Subscribed. Waiting for jobs...");
      break;
    case "start-job":
      startJob(msg, config);
      break;
    case "end-job":
      endJob(msg, config);
      break;
    case "error":
      console.error(`  [ws] Server error: ${msg.message}`);
      break;
  }
}

function sendStatus(jobId: string, status: string, config: AgentConfig) {
  if (activeWs?.readyState === WebSocket.OPEN) {
    activeWs.send(
      JSON.stringify({ type: "status", jobId, status, token: config.token }),
    );
  }
}

// --- Docker ---

function startJob(msg: any, config: AgentConfig) {
  const { jobId, dockerImage, ports, env } = msg;
  if (!jobId || !dockerImage) return;

  console.log(`  [job] Starting: ${jobId} (${dockerImage})`);
  sendStatus(jobId, "CREATING", config);

  const name = `${jobId}-axion`;
  try {
    execSync(`docker rm -f ${name}`, { stdio: "ignore" });
  } catch {}

  const args = ["run", "-d", "--name", name, "--label", "axion.job=true"];
  if (config.cpu) args.push("--cpus", String(config.cpu));
  if (config.ram) args.push("--memory", `${config.ram}g`);
  if (ports) for (const p of ports) args.push("-p", `${p}:${p}`);
  if (env)
    for (const [k, v] of Object.entries(env)) args.push("-e", `${k}=${v}`);
  args.push(dockerImage);

  sendStatus(jobId, "BOOTING", config);

  const proc = spawn("docker", args, { stdio: "pipe" });
  let cid = "";
  proc.stdout.on("data", (d: Buffer) => {
    cid = d.toString().trim();
  });

  proc.on("close", (code) => {
    if (code === 0 && cid) {
      console.log(`  [job] Running: ${jobId} (${cid.slice(0, 12)})`);
      sendStatus(jobId, "RUNNING", config);
    } else {
      console.error(`  [job] Failed: ${jobId}`);
      sendStatus(jobId, "DELETED", config);
    }
  });
}

function endJob(msg: any, config: AgentConfig) {
  const { jobId } = msg;
  if (!jobId) return;

  if (jobId === "all") {
    console.log("  [job] Stopping all containers (deactivated)");
    stopAllContainers();
    return;
  }

  console.log(`  [job] Stopping: ${jobId}`);
  const name = `${jobId}-axion`;
  try {
    execSync(`docker stop ${name} --time=10`, { stdio: "ignore" });
    execSync(`docker rm ${name}`, { stdio: "ignore" });
  } catch {}
  sendStatus(jobId, "DELETED", config);
}

function stopAllContainers() {
  try {
    const ids = execSync('docker ps -q --filter "label=axion.job=true"', {
      encoding: "utf-8",
    }).trim();
    if (ids) {
      execSync(`docker stop ${ids.split("\n").join(" ")} --time=10`, {
        stdio: "ignore",
      });
      execSync(`docker rm ${ids.split("\n").join(" ")}`, { stdio: "ignore" });
    }
  } catch {}
}
