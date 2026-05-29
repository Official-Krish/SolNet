import "dotenv/config";
import prisma from "@axion/db";
import { Router } from "express";
import axios from "axios";
import { authMiddleware } from "@axion/utilities/auth";
import { EscrowTopUpSchema } from "@axion/types";
import { vmQueue } from "../redis";
import { fail, getUserOr404, ok, MINUTE_MS } from "../utils/helpers";

const FREE_DISK_GB = 10;
const DISK_COST_PER_GB = 0.12;
const SOLANA_MINT = "So11111111111111111111111111111111111111112";
const JUPITER_PRICE_API = `https://lite-api.jup.ag/price/v3?ids=${SOLANA_MINT}`;

const vm = Router();

vm.get("/calculatePrice", authMiddleware, async (req, res) => {
  try {
    const machineType = req.query.machineType as string;
    const diskSize = parseInt(req.query.diskSize as string, 10);
    const basePrice = await prisma.vMTypes.findFirst({
      where: { machineType },
    });
    if (!basePrice) {
      fail(res, 404, "Machine type not found");
      return;
    }
    const additionalCost =
      diskSize > FREE_DISK_GB
        ? (diskSize - FREE_DISK_GB) * DISK_COST_PER_GB
        : 0;
    const totalPrice = basePrice.priceMonthlyUSD + additionalCost;
    const solPrice = await getSolPrice();
    ok(res, { price: totalPrice / solPrice });
  } catch (error) {
    console.error("Error calculating price:", error);
    fail(res, 500, "Internal server error");
  }
});

vm.get("/getVMTypes", authMiddleware, async (req, res) => {
  try {
    const vmTypes = await prisma.vMTypes.findMany();
    ok(res, vmTypes);
  } catch (error) {
    console.error("Error fetching VM types:", error);
    fail(res, 500, "Internal server error");
  }
});

vm.get("/getAll", authMiddleware, async (req, res) => {
  const adminKey = req.query.adminKey as string;
  if (adminKey !== process.env.ADMIN_KEY) {
    fail(res, 403, "Forbidden");
    return;
  }
  try {
    const vms = await prisma.vMInstance.findMany({
      include: { VMConfig: true },
    });
    ok(res, vms);
  } catch (error) {
    console.error("Error fetching VMs:", error);
    fail(res, 500, "Internal server error");
  }
});

vm.get("/checkNameAvailability", authMiddleware, async (req, res) => {
  const name = req.query.name as string;
  if (!name) {
    fail(res, 400, "Name is required");
    return;
  }
  try {
    const existingVM = await prisma.vMInstance.findFirst({
      where: { name, status: { not: "DELETED" } },
    });
    ok(res, { available: !existingVM });
  } catch (error) {
    console.error("Error checking name availability:", error);
    fail(res, 500, "Internal server error");
  }
});

vm.post("/topup", authMiddleware, async (req, res) => {
  const parsedData = EscrowTopUpSchema.safeParse(req.body);
  if (!parsedData.success) {
    fail(res, 400, "Invalid request data");
    return;
  }
  const user = await getUserOr404(res, req.userId);
  if (!user) return;

  try {
    const { id, amount, additionalEscrowDuration } = parsedData.data;
    const vmInstance = await prisma.vMInstance.findFirst({
      where: { id, userId: req.userId },
    });
    if (!vmInstance) {
      fail(res, 404, "VM instance not found");
      return;
    }
    if (vmInstance.PaymentType !== "ESCROW") {
      fail(res, 400, "VM instance is not in ESCROW status");
      return;
    }

    const remainingTime = vmInstance.endTime.getTime() - Date.now();
    const oldJob = await vmQueue.getJob(vmInstance.jobId);
    if (oldJob) await oldJob.remove();

    const newJob =
      vmInstance.provider === "LOCAL"
        ? await vmQueue.add(
            "terminate-depin-vm",
            { pubKey: user.publicKey, id },
            { delay: remainingTime + additionalEscrowDuration * MINUTE_MS },
          )
        : await vmQueue.add(
            "terminate-vm",
            {
              instanceId: vmInstance.instanceId,
              vmId: vmInstance.id,
              zone: vmInstance.region,
              pubKey: user.publicKey,
            },
            { delay: remainingTime + additionalEscrowDuration * MINUTE_MS },
          );

    const updatedVM = await prisma.vMInstance.update({
      where: { id },
      data: {
        price: { increment: amount },
        endTime: new Date(
          vmInstance.endTime.getTime() + additionalEscrowDuration * MINUTE_MS,
        ),
        jobId: newJob.id,
      },
    });

    ok(res, { msg: "Top up successful", vm: updatedVM });
  } catch (error) {
    console.error("Error during top up:", error);
    fail(res, 500, "Internal server error");
  }
});

export default vm;

async function getSolPrice() {
  const res = await axios.get(JUPITER_PRICE_API, { timeout: 5000 });
  return Number(res.data[SOLANA_MINT].usdPrice);
}
