import "dotenv/config";
import { Router } from "express";
import {
  ChangeVMStatusSchema,
  ClaimSOLSchema,
  DepinVerificationSchema,
  RegisterVMSchema,
} from "@decloud/types";
import prisma from "@decloud/db";
import { initialiseAccount } from "../redis";
import { calculatePricePerHour } from "../utils/calculatePrice";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../utils/authMiddleware";

const depinRouter = Router();

depinRouter.post("/depinVerification", async (req, res) => {
  const parseData = DepinVerificationSchema.safeParse(req.body);
  if (!parseData.success) {
    res.status(400).json({ error: parseData.error.errors });
    return;
  }
  try {
    const { os, cpu_cores, ram_gb, disk_gb, ip_address, wallet, Key } =
      parseData.data;
    const user = await prisma.user.findFirst({
      where: {
        publicKey: wallet,
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const vm = await prisma.depinHostMachine.findFirst({
      where: {
        ipAddress: ip_address,
      },
    });
    if (!vm) {
      res.status(404).json({ error: "VM not found" });
      return;
    }
    const isKeyValid = await bcrypt.compare(Key, vm.Key);
    if (!isKeyValid) {
      res.status(400).json({ error: "Invalid Key" });
      return;
    }
    // check vm details
    if (
      vm.os !== os ||
      vm.cpu !== cpu_cores ||
      vm.ram !== ram_gb ||
      vm.diskSize !== disk_gb
    ) {
      await prisma.depinHostMachine.delete({
        where: { id: vm.id },
      });
      res.status(400).json({ error: "VM details do not match" });
      return;
    }
    const pricePerHour = calculatePricePerHour(cpu_cores, ram_gb, disk_gb);
    await prisma.depinHostMachine.update({
      where: { id: vm.id },
      data: {
        verified: true,
        perHourPrice: pricePerHour,
      },
    });

    initialiseAccount.add("initialise-host-pda", {
      id: vm.id,
      hostName: user.name,
      machineType: vm.machineType,
      os: vm.os,
      diskSize: vm.diskSize,
      pricePerHour: pricePerHour,
      userPubKey: wallet,
    });
    const token = jwt.sign(
      {
        id: vm.id,
        userPublicKey: wallet,
      },
      process.env.JWT_SECRET || "default_secret",
    );

    res
      .status(200)
      .json({ message: "VM verified successfully", host_id: vm.id, token });
  } catch (error) {
    console.error("Error in depin verification:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

depinRouter.post("/register", authMiddleware, async (req, res) => {
  const ParseData = RegisterVMSchema.safeParse(req.body);
  if (!ParseData.success) {
    res.status(400).json({ error: ParseData.error.errors });
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
    res.status(200).json({ message: "VM registered successfully", vm });
  } catch (error) {
    console.error("Error registering VM:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

depinRouter.post("/changeVisibility", authMiddleware, async (req, res) => {
  const parseData = ChangeVMStatusSchema.safeParse(req.body);
  if (!parseData.success) {
    res.status(400).json({ error: parseData.error.errors });
    return;
  }
  const { id, pubKey, status, Key } = parseData.data;
  try {
    const vm = await prisma.depinHostMachine.findFirst({
      where: {
        id,
        userPublicKey: pubKey,
      },
    });
    if (!vm) {
      res.status(404).json({ error: "VM not found" });
      return;
    }
    const isKeyValid = await bcrypt.compare(Key, vm.Key);
    if (!isKeyValid) {
      res.status(400).json({ error: "Invalid Key" });
      return;
    }
    await prisma.depinHostMachine.update({
      where: {
        id,
        userPublicKey: pubKey,
      },
      data: { isActive: status },
    });
    res.status(200).json({ message: "VM visibility updated successfully" });
  } catch (error) {
    console.error("Error fetching VM:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

depinRouter.get("/getAll", authMiddleware, async (req, res) => {
  const userPublicKey = req.query.userPublicKey as string;
  if (!userPublicKey) {
    res.status(400).json({ error: "User public key is required" });
    return;
  }
  try {
    const vms = await prisma.depinHostMachine.findMany({
      where: {
        userPublicKey: userPublicKey,
      },
    });
    res.status(200).json(vms);
  } catch (error) {
    console.error("Error fetching VMs:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

depinRouter.get("/getById", authMiddleware, async (req, res) => {
  const id = req.query.id as string;
  if (!id) {
    res.status(400).json({ error: "VM ID is required" });
    return;
  }
  try {
    const vm = await prisma.depinHostMachine.findFirst({
      where: { id },
    });
    if (!vm) {
      res.status(404).json({ error: "VM not found" });
      return;
    }
    res.status(200).json(vm);
  } catch (error) {
    console.error("Error fetching VM:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

depinRouter.post("/claimSOL", authMiddleware, async (req, res) => {
  const parseData = ClaimSOLSchema.safeParse(req.body);
  if (!parseData.success) {
    res.status(400).json({ error: parseData.error.errors });
    return;
  }
  try {
    const { id, pubKey, amount } = parseData.data;

    const vm = await prisma.depinHostMachine.findFirst({
      where: {
        id,
        userPublicKey: pubKey,
      },
    });
    if (!vm) {
      res.status(404).json({ error: "VM not found" });
      return;
    }
    if (vm.isActive) {
      res.status(400).json({ error: "Cannot claim SOL while VM is active" });
      return;
    }

    await prisma.depinHostMachine.update({
      where: {
        id,
        userPublicKey: pubKey,
      },
      data: {
        claimedSOL: { increment: amount },
      },
    });

    res.status(200).json({ message: "SOL claimed successfully" });
  } catch (error) {
    console.error("Error claiming SOL:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default depinRouter;
