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
  initialiseAccount,
  terminateDepinVMQueue,
} from "../redis";
import bcrypt from "bcrypt";
import { calculatePricePerHour } from "../utils/calculatePrice";
import { fail, getUserOr404, ok, signToken } from "../utils/helpers";

const depinVM = Router();
const ws = new WebSocket(process.env.DEPIN_WS_URL || "ws://localhost:8080");
ws.addEventListener("error", (err) => console.error("DePIN WS error:", err));

depinVM.post("/findVM", authMiddleware, async (req, res) => {
  const user = await getUserOr404(res, req.userId);
  if (!user) return;

  const parseData = FindVmSchema.safeParse(req.body);
  if (!parseData.success) {
    fail(res, 400, "Invalid request body");
    return;
  }

  try {
    const { cpu, ram, diskSize } = parseData.data;
    const findVm = await prisma.depinHostMachine.findFirst({
      where: {
        isActive: true,
        cpu: { gte: parseInt(cpu) },
        ram: { gte: parseInt(ram) },
        diskSize: { gte: parseInt(diskSize) },
        isOccupied: false,
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
      const portList = ports
        ? ports
            .split(",")
            .map((p) => parseInt(p.trim()))
            .filter((p) => !isNaN(p))
        : [];
      const token = signToken({ id: req.userId!, machineId: findVm.id });
      try {
        ws.send(
          JSON.stringify({
            type: "start-job",
            jobId: id,
            dockerImage,
            ports: portList,
            env: envVars ? envVars.split(",") : [],
            machineId: findVm.id,
            token,
          }),
        );
      } catch (e) {
        console.error("WS send error:", e);
      }

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
          applicationPort: portList[0] || 0,
          envVariables: envVars ? envVars.split(",") : [],
          applicationUrl: `https://${config.id}-Axion.krishlabs.tech`,
        },
      });
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
      try {
        ws.send(
          JSON.stringify({ type: "end-job", jobId: vmId, machineId, token }),
        );
      } catch (e) {
        console.error("WS send error:", e);
      }
      await tx.vMInstance.update({
        where: { id: vmId },
        data: { status: "TERMINATED" },
      });
      const depinHost = await tx.depinHostMachine.update({
        where: { id: vmInstance.id },
        data: { isOccupied: false },
      });
      await activateHostQueue.add("changeVMStatus", {
        id: depinHost.id,
        userPubKey: depinHost.userPublicKey,
        status: false,
      });
    });
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
    const { os, cpu_cores, ram_gb, disk_gb, ip_address, wallet, Key } =
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

    const isKeyValid = await bcrypt.compare(Key, vm.Key);
    if (!isKeyValid) {
      fail(res, 400, "Invalid Key");
      return;
    }

    if (
      vm.os !== os ||
      vm.cpu !== cpu_cores ||
      vm.ram !== ram_gb ||
      vm.diskSize !== disk_gb
    ) {
      await prisma.depinHostMachine.delete({ where: { id: vm.id } });
      fail(res, 400, "VM details do not match");
      return;
    }

    const pricePerHour = calculatePricePerHour(cpu_cores, ram_gb, disk_gb);
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
    ok(res, { message: "VM verified successfully", host_id: vm.id, token });
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
    const { id, pubKey, amount } = parseData.data;
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

    await prisma.depinHostMachine.update({
      where: { id, userPublicKey: pubKey },
      data: { claimedSOL: { increment: amount } },
    });
    ok(res, { message: "SOL claimed successfully" });
  } catch (error) {
    console.error("Error claiming SOL:", error);
    fail(res, 500, "Internal server error");
  }
});

const MINUTE_MS = 60 * 1000;
export default depinVM;
