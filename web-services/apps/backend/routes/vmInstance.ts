import "dotenv/config";
import { Router } from "express";
import { authMiddleware } from "@axion/utilities/auth";
import { VmInstanceSchema } from "@axion/types";
import prisma from "@axion/db";
import { createInstance } from "../utils/createVm";
import { deleteInstance } from "../utils/deleteVm";
import compute from "@google-cloud/compute";
import { vmQueue } from "../redis";
import {
  fail,
  getUserOr404,
  ok,
  signToken,
  MINUTE_MS,
  TWELVE_HOURS_MS,
} from "../utils/helpers";

const vmInstance = Router();
const instancesClient = new compute.InstancesClient();

vmInstance.post("/create", authMiddleware, async (req, res) => {
  const parsedBody = VmInstanceSchema.safeParse(req.body);
  if (!parsedBody.success) {
    fail(res, 400, "Invalid request body");
    return;
  }

  const user = await getUserOr404(res, req.userId);
  if (!user) return;

  if (user.timeoutAt) {
    const elapsed = Date.now() - new Date(user.timeoutAt).getTime();
    if (elapsed < TWELVE_HOURS_MS) {
      fail(res, 403, "You can only create a VM once every 12 hours");
      return;
    }
  }

  try {
    const {
      name,
      region,
      price,
      provider,
      os,
      machineType,
      diskSize,
      id,
      paymentType,
    } = parsedBody.data;
    const DEFAULT_RENTAL_DURATION_MINUTES = 10;
    const endTime = DEFAULT_RENTAL_DURATION_MINUTES;

    const existingVm = await prisma.vMInstance.findFirst({
      where: { name, userId: req.userId, status: { not: "DELETED" } },
    });
    if (existingVm) {
      fail(res, 409, "VM with this name already exists");
      return;
    }

    const response = await createInstance(name, region, machineType, "10", os);
    const transaction = await prisma.$transaction(async (tx) => {
      const job = await vmQueue.add(
        "terminate-vm",
        {
          instanceId: response.instanceId,
          zone: region,
          pubKey: user.publicKey,
          isEscrow: paymentType === "ESCROW",
          id,
        },
        { delay: endTime * MINUTE_MS },
      );

      const vm = await tx.vMInstance.create({
        data: {
          id,
          name,
          jobId: job.id || id,
          PaymentType: paymentType,
          region,
          ipAddress: response.ipAddress,
          endTime: new Date(Date.now() + Number(endTime) * MINUTE_MS),
          price,
          provider,
          startTime: new Date(),
          userId: req.userId!,
          instanceId: response.instanceId ?? "unknown",
          publicKey: response.publicKey,
          status: "RUNNING",
        },
      });
      await tx.vMConfig.create({
        data: { os, machineType, diskSize, vmId: vm.id },
      });
      await tx.user.update({
        where: { id: req.userId! },
        data: { timeoutAt: new Date() },
      });
      return {
        vm,
        instanceId: response.instanceId,
        ipAddress: response.ipAddress,
        privateKey: response.privateKey,
      };
    });

    const AuthToken = signToken(
      {
        userId: req.userId!,
        allowedVms: transaction.vm.ipAddress!,
        privateKey: transaction.privateKey,
      },
      Math.floor(Number(endTime) * MINUTE_MS),
    );

    ok(res, {
      message: "VM instance created successfully",
      vmId: transaction.vm.id,
      instanceId: transaction.instanceId,
      ip: transaction.ipAddress,
      AuthToken,
      PrivateKey: transaction.privateKey,
    });
  } catch (error) {
    console.error("Error during VM instance creation:", error);
    fail(res, 500, "Internal server error");
  }
});

vmInstance.get("/pollStatus", authMiddleware, async (req, res) => {
  const instanceId = req.query.instanceId as string;
  const vmId = req.query.id as string;
  if (!instanceId || !vmId) {
    fail(res, 400, "ID is required");
    return;
  }

  try {
    const vmInstance = await prisma.vMInstance.findUnique({
      where: { id: vmId, instanceId },
    });
    if (!vmInstance) {
      fail(res, 404, "VM instance not found");
      return;
    }

    const operationsClient = new compute.ZoneOperationsClient();
    await operationsClient.wait({
      operation: vmInstance.instanceId,
      project: process.env.PROJECT_ID,
      zone: vmInstance.region,
    });
    const [instance] = await instancesClient.get({
      project: process.env.PROJECT_ID,
      zone: vmInstance.region,
      instance: vmInstance.instanceId,
    });
    const status = instance.status;
    if (!status) {
      fail(res, 404, "VM instance not found");
      return;
    }

    await prisma.vMInstance.update({
      where: { id: vmId, instanceId },
      data: { status },
    });
    ok(res, { vmId, status });
  } catch (e) {
    console.error("Error during VM status polling:", e);
    fail(res, 500, "Internal server error");
  }
});

vmInstance.delete("/destroy", authMiddleware, async (req, res) => {
  const instanceId = req.query.instanceId as string;
  const vmId = req.query.vmId as string;
  const zone = req.query.zone as string;
  if (!instanceId || !vmId || !zone) {
    fail(res, 400, "instance Id, VM ID, and zone are required");
    return;
  }

  try {
    const vmInstance = await prisma.vMInstance.findFirst({
      where: { id: vmId, instanceId },
    });
    if (!vmInstance) {
      fail(res, 404, "VM instance not found");
      return;
    }

    const remainingTime = vmInstance.endTime.getTime() - Date.now();
    await deleteInstance(zone, instanceId);
    await prisma.vMInstance.update({
      where: { id: vmId, instanceId },
      data: { status: "DELETED" },
    });
    ok(res, {
      message: "VM instance deleted successfully",
      remainingTime: remainingTime > 0 ? remainingTime : 0,
    });
  } catch (error) {
    console.error("Error during VM instance deletion:", error);
    fail(res, 500, "Internal server error");
  }
});

vmInstance.get("/getAll", authMiddleware, async (req, res) => {
  try {
    const vms = await prisma.vMInstance.findMany({
      where: { userId: req.userId },
      include: { VMConfig: true },
      orderBy: { createdAt: "desc" },
    });
    ok(res, { vms });
  } catch (error) {
    console.error("Error fetching VM instances:", error);
    fail(res, 500, "Internal server error");
  }
});

vmInstance.get("/getDetails", authMiddleware, async (req, res) => {
  const id = req.query.id as string;
  if (!id) {
    fail(res, 400, "VM ID is required");
    return;
  }

  try {
    const vmInstance = await prisma.vMInstance.findFirst({
      where: { id },
      include: { VMConfig: true },
    });
    if (!vmInstance) {
      fail(res, 404, "VM instance not found");
      return;
    }
    ok(res, { vmInstance });
  } catch (error) {
    console.error("Error fetching VM instance details:", error);
    fail(res, 500, "Internal server error");
  }
});

export default vmInstance;
