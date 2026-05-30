import { Router } from "express";
import { authMiddleware } from "@axion/utilities/auth";
import prisma from "@axion/db";
import {
  ChangeVMStatusSchema,
  ClaimSOLSchema,
  DepinDeployVmSchema,
  DepinVerificationSchema,
  FindVmSchema,
  RegisterVMSchema,
} from "@axion/types";
import {
  activateHostQueue,
  claimRewardsQueue,
  initialiseAccount,
  terminateDepinVMQueue,
} from "../redis";
import bcrypt from "bcrypt";
import { calculatePricePerHour } from "../utils/calculatePrice";
import { fail, getUserOr404, ok, signToken } from "../utils/helpers";
import { getCloudflareAPI } from "../utils/cloudflare";

const depinVM = Router();

// --- Resilient WS connection to depin-ws-relayer with auto-reconnect ---
const DEPIN_WS_URL = process.env.DEPIN_WS_URL || "ws://localhost:8080";
let ws: WebSocket | null = null;
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;

function connectDepinWs() {
  ws = new WebSocket(DEPIN_WS_URL);
  ws.addEventListener("open", () => {
    console.log("[depin-ws] Connected");
    if (wsReconnectTimer) {
      clearTimeout(wsReconnectTimer);
      wsReconnectTimer = null;
    }
  });
  ws.addEventListener("error", (err) =>
    console.error("[depin-ws] Error:", err),
  );
  ws.addEventListener("close", () => {
    console.warn("[depin-ws] Disconnected, reconnecting in 3s...");
    wsReconnectTimer = setTimeout(connectDepinWs, 3000);
  });
}
connectDepinWs();

function wsSend(payload: object): boolean {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
    return true;
  }
  console.error("[depin-ws] Cannot send, not connected");
  return false;
}

// --- Helper: parse "KEY=VAL,KEY2=VAL2" into Record<string,string> ---
function parseEnvVars(envVars?: string): Record<string, string> {
  if (!envVars) return {};
  const result: Record<string, string> = {};
  for (const pair of envVars.split(",")) {
    const eq = pair.indexOf("=");
    if (eq > 0) result[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return result;
}

let _cf: ReturnType<typeof getCloudflareAPI> | null = null;
function getCF() {
  if (!_cf) {
    try {
      _cf = getCloudflareAPI();
    } catch {
      return null;
    }
  }
  return _cf;
}

depinVM.post("/findVM", authMiddleware, async (req, res) => {
  const user = await getUserOr404(res, req.userId);
  if (!user) return;

  const parseData = FindVmSchema.safeParse(req.body);
  if (!parseData.success) {
    fail(res, 400, "Invalid request body");
    return;
  }

  try {
    const { cpu, ram, diskSize, dockerImage } = parseData.data;

    // Verify docker image exists
    const [repo, tag = "latest"] = dockerImage.includes("/")
      ? [dockerImage.split(":")[0], dockerImage.split(":")[1] || "latest"]
      : [
          `library/${dockerImage.split(":")[0]}`,
          dockerImage.split(":")[1] || "latest",
        ];
    const registryRes = await fetch(
      `https://hub.docker.com/v2/repositories/${repo}/tags/${tag}`,
    );
    if (!registryRes.ok) {
      fail(res, 400, `Docker image '${dockerImage}' not found on Docker Hub`);
      return;
    }

    const findVm = await prisma.depinHostMachine.findFirst({
      where: {
        isActive: true,
        cpu: { gte: parseInt(cpu) },
        ram: { gte: parseInt(ram) },
        diskSize: { gte: parseInt(diskSize) },
        isOccupied: false,
        verified: true,
        perHourPrice: { gt: 0 },
      },
    });
    if (!findVm) {
      fail(res, 404, "No suitable VM found for deployment");
      return;
    }
    ok(res, { message: "Deployment request sent successfully", vm: findVm });
  } catch (error) {
    console.error("Error deploying image:", error);
    fail(res, 500, "Internal server error");
  }
});

depinVM.post("/deploy", authMiddleware, async (req, res) => {
  const user = await getUserOr404(res, req.userId);
  if (!user) return;

  const parseData = DepinDeployVmSchema.safeParse(req.body);
  if (!parseData.success) {
    fail(res, 400, "Invalid request body");
    return;
  }

  try {
    const {
      appName,
      dockerImage,
      cpu,
      ram,
      diskSize,
      ports,
      envVars,
      escrowAmount,
      endTime,
      VmId,
      id,
      description,
    } = parseData.data;
    const findVm = await prisma.depinHostMachine.findFirst({
      where: { id: VmId, isActive: true, isOccupied: false },
    });
    if (!findVm) {
      fail(res, 404, "No suitable VM found for deployment");
      return;
    }

    const txn = await prisma.$transaction(async (tx) => {
      const portList = ports[0]
        ? ports[0]
            .split(",")
            .map((p) => parseInt(p.trim()))
            .filter((p) => !isNaN(p))
        : [];
      const token = signToken({ id: req.userId!, machineId: findVm.id });
      const cf = getCF();
      const containerPort = portList[0] || 80;
      const subdomain = `${id}-depin.${cf?.domain || "axion.krishlabs.tech"}`;
      wsSend({
        type: "start-job",
        jobId: id,
        dockerImage,
        containerPort,
        subdomain,
        env: parseEnvVars(envVars),
        machineId: findVm.id,
        token,
      });

      await tx.depinHostMachine.update({
        where: { id: findVm.id },
        data: { isOccupied: true },
      });
      await activateHostQueue.add("changeVMStatus", {
        id: findVm.id,
        userPubKey: findVm.userPublicKey,
        status: true,
      });

      const job = await terminateDepinVMQueue.add(
        "terminate-depin-vm",
        { pubKey: user.publicKey, id: findVm.id },
        { delay: endTime * MINUTE_MS },
      );

      const config = await tx.vMInstance.create({
        data: {
          id,
          name: appName,
          userId: req.userId!,
          jobId: job.id || findVm.id,
          status: "DEPLOYING",
          PaymentType: "ESCROW",
          region: findVm.region,
          ipAddress: findVm.ipAddress,
          endTime: new Date(Date.now() + Number(endTime) * MINUTE_MS),
          provider: "LOCAL",
          price: escrowAmount,
          startTime: new Date(),
        },
      });

      await tx.vMImage.create({
        data: {
          id,
          name: appName,
          description,
          dockerImage,
          cpu: parseInt(cpu),
          ram: parseInt(ram),
          diskSize: parseInt(diskSize),
          depinHostMachineId: findVm.id,
          os: findVm.os,
          applicationPort: containerPort,
          envVariables: envVars ? envVars.split(",").map((s) => s.trim()) : [],
          applicationUrl: `https://${subdomain}`,
        },
      });

      // Create Cloudflare DNS record
      if (cf && findVm.tunnelId) {
        try {
          await cf.createDNSRecord(id, findVm.tunnelId);
        } catch (err) {
          console.error("Error creating DNS record:", err);
        }
      }
      return config;
    });

    ok(res, {
      message: "Deployment request sent successfully",
      id: txn.id,
      name: txn.name,
    });
  } catch (error) {
    console.error("Error deploying image:", error);
    fail(res, 500, "Internal server error");
  }
});

depinVM.delete("/terminate/:id", authMiddleware, async (req, res) => {
  const user = await getUserOr404(res, req.userId);
  if (!user) return;

  const vmId = req.params.id;
  const vmInstance = await prisma.vMInstance.findFirst({
    where: { id: vmId, userId: req.userId },
    include: { VMImage: true },
  });
  if (!vmInstance) {
    fail(res, 404, "VM instance not found");
    return;
  }
  const machineId = vmInstance.VMImage?.depinHostMachineId;
  if (!machineId) {
    fail(res, 400, "No host machine associated with this VM");
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const token = signToken({ id: req.userId!, machineId }, "5Mins");
      wsSend({ type: "end-job", jobId: vmId, machineId, token });
      await tx.vMInstance.update({
        where: { id: vmId },
        data: { status: "TERMINATED" },
      });
      await tx.depinHostMachine.update({
        where: { id: machineId },
        data: { isOccupied: false },
      });
    });

    // Enqueue settlement (3-way split on-chain)
    await terminateDepinVMQueue.add("terminate-depin-vm", {
      pubKey: user.publicKey,
      id: machineId,
    });

    // Delete Cloudflare DNS record
    const cf = getCF();
    if (cf) {
      try {
        await cf.deleteDNSRecord(vmId);
      } catch (err) {
        console.error("Error deleting DNS record:", err);
      }
    }

    ok(res, { message: "Termination request sent successfully" });
  } catch (error) {
    console.error("Error terminating VM:", error);
    fail(res, 500, "Internal server error");
  }
});

depinVM.post("/depinVerification", async (req, res) => {
  const parseData = DepinVerificationSchema.safeParse(req.body);
  if (!parseData.success) {
    fail(res, 400, "Invalid request body");
    return;
  }

  try {
    const { os, cpu_cores, ram_gb, disk_gb, ip_address, wallet, key } =
      parseData.data;
    const user = await prisma.user.findFirst({ where: { publicKey: wallet } });
    if (!user) {
      fail(res, 404, "User not found");
      return;
    }

    const vm = await prisma.depinHostMachine.findFirst({
      where: { ipAddress: ip_address },
    });
    if (!vm) {
      fail(res, 404, "VM not found");
      return;
    }

    const isKeyValid = await bcrypt.compare(key, vm.Key);
    if (!isKeyValid) {
      fail(res, 400, "Invalid Key");
      return;
    }

    if (
      vm.os !== os ||
      Number(cpu_cores) < vm.cpu ||
      Number(ram_gb) < vm.ram ||
      Number(disk_gb) < vm.diskSize
    ) {
      await prisma.depinHostMachine.delete({ where: { id: vm.id } });
      fail(res, 400, "VM details do not match");
      return;
    }

    const pricePerHour = calculatePricePerHour(
      Number(cpu_cores),
      Number(ram_gb),
      Number(disk_gb),
    );
    await prisma.depinHostMachine.update({
      where: { id: vm.id },
      data: { verified: true, perHourPrice: pricePerHour },
    });
    await initialiseAccount.add("initialise-host-pda", {
      id: vm.id,
      hostName: user.name,
      machineType: vm.machineType,
      os: vm.os,
      diskSize: vm.diskSize,
      pricePerHour,
      userPubKey: wallet,
    });

    const token = signToken({ id: vm.id, userPublicKey: wallet });

    // Fetch tunnel token for cloudflared --token mode
    let tunnelToken: string | null = null;
    const cf = getCF();
    if (cf && vm.tunnelId) {
      try {
        const tokenRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel/${vm.tunnelId}/token`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN!}`,
            },
          },
        );
        const tokenBody = (await tokenRes.json()) as {
          success: boolean;
          result: string;
        };
        if (tokenBody.success) tunnelToken = tokenBody.result;
      } catch (err) {
        console.error("Error fetching tunnel token:", err);
      }
    }

    ok(res, {
      message: "VM verified successfully",
      host_id: vm.id,
      token,
      tunnelToken,
      tunnelId: vm.tunnelId,
    });
  } catch (error) {
    console.error("Error in depin verification:", error);
    fail(res, 500, "Internal server error");
  }
});

depinVM.post("/register", authMiddleware, async (req, res) => {
  const ParseData = RegisterVMSchema.safeParse(req.body);
  if (!ParseData.success) {
    fail(res, 400, "Invalid request body");
    return;
  }

  try {
    const {
      machineType,
      ipAddress,
      cpu,
      ram,
      diskSize,
      region,
      userPublicKey,
      os,
      Key,
    } = ParseData.data;
    const vm = await prisma.depinHostMachine.create({
      data: {
        machineType,
        ipAddress,
        cpu,
        ram,
        diskSize,
        region,
        os,
        userPublicKey,
        Key: bcrypt.hashSync(Key, 10),
      },
    });

    // Create Cloudflare tunnel for this host
    const cf = getCF();
    if (cf) {
      try {
        const tunnel = await cf.createTunnel(vm.id);
        await prisma.depinHostMachine.update({
          where: { id: vm.id },
          data: {
            tunnelId: tunnel.tunnelId,
            tunnelCredentials: JSON.stringify(tunnel.credentials),
          },
        });
      } catch (err) {
        console.error("Error creating Cloudflare tunnel:", err);
      }
    }

    ok(res, { message: "VM registered successfully", vm });
  } catch (error) {
    console.error("Error registering VM:", error);
    fail(res, 500, "Internal server error");
  }
});

depinVM.post("/changeVisibility", authMiddleware, async (req, res) => {
  const parseData = ChangeVMStatusSchema.safeParse(req.body);
  if (!parseData.success) {
    fail(res, 400, "Invalid request body");
    return;
  }

  const { id, pubKey, status, Key } = parseData.data;
  try {
    const vm = await prisma.depinHostMachine.findFirst({
      where: { id, userPublicKey: pubKey },
    });
    if (!vm) {
      fail(res, 404, "VM not found");
      return;
    }

    const isKeyValid = await bcrypt.compare(Key, vm.Key);
    if (!isKeyValid) {
      fail(res, 400, "Invalid Key");
      return;
    }

    await prisma.depinHostMachine.update({
      where: { id, userPublicKey: pubKey },
      data: { isActive: status },
    });

    // Notify host agent via WS relayer
    try {
      const token = signToken({ id: req.userId!, machineId: id }, "5Mins");
      if (!status) {
        wsSend({ type: "end-job", jobId: "all", machineId: id, token });
      }
    } catch (e) {
      console.error("WS send error:", e);
    }

    ok(res, { message: "VM visibility updated successfully" });
  } catch (error) {
    console.error("Error fetching VM:", error);
    fail(res, 500, "Internal server error");
  }
});

depinVM.get("/getAll", authMiddleware, async (req, res) => {
  const userPublicKey = req.query.userPublicKey as string;
  if (!userPublicKey) {
    fail(res, 400, "User public key is required");
    return;
  }

  try {
    const vms = await prisma.depinHostMachine.findMany({
      where: { userPublicKey },
    });
    ok(res, vms);
  } catch (error) {
    console.error("Error fetching VMs:", error);
    fail(res, 500, "Internal server error");
  }
});

depinVM.get("/getById", authMiddleware, async (req, res) => {
  const id = req.query.id as string;
  if (!id) {
    fail(res, 400, "VM ID is required");
    return;
  }

  try {
    const vm = await prisma.depinHostMachine.findFirst({ where: { id } });
    if (!vm) {
      fail(res, 404, "VM not found");
      return;
    }
    ok(res, vm);
  } catch (error) {
    console.error("Error fetching VM:", error);
    fail(res, 500, "Internal server error");
  }
});

depinVM.post("/claimSOL", authMiddleware, async (req, res) => {
  const parseData = ClaimSOLSchema.safeParse(req.body);
  if (!parseData.success) {
    fail(res, 400, "Invalid request body");
    return;
  }

  try {
    const { id, pubKey } = parseData.data;
    const vm = await prisma.depinHostMachine.findFirst({
      where: { id, userPublicKey: pubKey },
    });
    if (!vm) {
      fail(res, 404, "VM not found");
      return;
    }
    if (vm.isActive) {
      fail(res, 400, "Cannot claim SOL while VM is active");
      return;
    }

    await claimRewardsQueue.add("claim-rewards", {
      id: vm.id,
      userPubKey: pubKey,
    });
    ok(res, { message: "Claim request submitted" });
  } catch (error) {
    console.error("Error claiming SOL:", error);
    fail(res, 500, "Internal server error");
  }
});

const MINUTE_MS = 60 * 1000;

depinVM.get("/settlement/:id", authMiddleware, async (req, res) => {
  const user = await getUserOr404(res, req.userId);
  if (!user) return;

  const vmId = req.params.id;
  try {
    const settlement = await prisma.depinSettlement.findFirst({
      where: { jobId: vmId },
    });
    ok(res, { settlement });
  } catch (error) {
    console.error("Error fetching settlement:", error);
    fail(res, 500, "Internal server error");
  }
});

export default depinVM;
