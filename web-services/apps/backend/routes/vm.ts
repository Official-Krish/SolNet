import "dotenv/config";
import prisma from "@decloud/db";
import { Router } from "express";
import axios from "axios";
import { authMiddleware } from "../utils/middleware";
import { EscrowTopUpSchema } from "@decloud/types";
import { vmQueue } from "../redis";

const FREE_DISK_GB = 10;
const DISK_COST_PER_GB = 0.12;
const MINUTE_MS = 60 * 1000;
const DAYS_IN_MONTH = 30;
const SOLANA_MINT = "So11111111111111111111111111111111111111112";
const JUPITER_PRICE_API = `https://lite-api.jup.ag/price/v3?ids=${SOLANA_MINT}`;

const vm = Router();

vm.get("/calculatePrice", authMiddleware, async (req, res) => {
  try {
    const machineType = req.query.machineType as string;
    const diskSize = parseInt(req.query.diskSize as string, 10);
    const basePrice = await prisma.vMTypes.findFirst({
      where: {
        machineType: machineType,
      },
    });
    if (!basePrice) {
      return res.status(404).json({ error: "Machine type not found" });
    }
    const additionalCost =
      diskSize > FREE_DISK_GB
        ? (diskSize - FREE_DISK_GB) * DISK_COST_PER_GB
        : 0;
    const totalPrice = basePrice.priceMonthlyUSD + additionalCost;
    const solPrice = await getSolPrice();
    const price = totalPrice / solPrice;
    res.status(200).json({ price: price });
  } catch (error) {
    console.error("Error calculating price:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

vm.get("/getVMTypes", authMiddleware, async (req, res) => {
  try {
    const vmTypes = await prisma.vMTypes.findMany();
    res.status(200).json(vmTypes);
  } catch (error) {
    console.error("Error fetching VM types:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

vm.get("/getAll", authMiddleware, async (req, res) => {
  const adminKey = req.query.adminKey as string;
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const vms = await prisma.vMInstance.findMany({
      include: {
        VMConfig: true,
      },
    });
    if (!vms || vms.length === 0) {
      res.status(200).json([]);
      return;
    }
    res.status(200).json(vms);
  } catch (error) {
    console.error("Error fetching VMs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

vm.get("/checkNameAvailability", authMiddleware, async (req, res) => {
  const name = req.query.name as string;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  try {
    const existingVM = await prisma.vMInstance.findFirst({
      where: {
        name: name,
        status: {
          not: "DELETED",
        },
      },
    });
    if (existingVM) {
      return res.status(200).json({ available: false });
    }
    res.status(200).json({ available: true });
  } catch (error) {
    console.error("Error checking name availability:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

vm.post("/topup", authMiddleware, async (req, res) => {
  const parsedData = EscrowTopUpSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ error: "Invalid request data" });
    return;
  }
  const userId = req.userId;
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { publicKey: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    const { id, amount, additionalEscrowDuration } = parsedData.data;
    const vmInstance = await prisma.vMInstance.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });
    if (!vmInstance) {
      res.status(404).json({ error: "VM instance not found" });
      return;
    }
    if (vmInstance.PaymentType !== "ESCROW") {
      res.status(400).json({ error: "VM instance is not in ESCROW status" });
      return;
    }

    const remainingTime = vmInstance.endTime.getTime() - Date.now();

    const oldJob = await vmQueue.getJob(vmInstance.jobId);
    if (oldJob) await oldJob.remove();
    const newJob =
      vmInstance.provider === "LOCAL"
        ? await vmQueue.add(
            "terminate-depin-vm",
            {
              pubKey: user.publicKey,
              id: id,
            },
            {
              delay: remainingTime + additionalEscrowDuration * MINUTE_MS,
            },
          )
        : await vmQueue.add(
            "terminate-vm",
            {
              instanceId: vmInstance.instanceId,
              vmId: vmInstance.id,
              zone: vmInstance.region,
              pubKey: user.publicKey,
            },
            {
              delay: remainingTime + additionalEscrowDuration * MINUTE_MS,
            },
          );

    const updatedVM = await prisma.vMInstance.update({
      where: { id: id },
      data: {
        price: {
          increment: amount,
        },
        endTime: new Date(
          vmInstance.endTime.getTime() + additionalEscrowDuration * MINUTE_MS,
        ),
        jobId: newJob.id,
      },
    });

    res.status(200).json({ msg: "Top up successful", vm: updatedVM });
  } catch (error) {
    console.error("Error during top up:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default vm;

async function getSolPrice() {
  const res = await axios.get(JUPITER_PRICE_API);
  return Number(res.data[SOLANA_MINT].usdPrice);
}
