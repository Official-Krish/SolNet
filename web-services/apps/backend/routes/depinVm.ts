import { Router } from "express";
import { authMiddleware } from "../utils/middleware";
import prisma from "@decloud/db";
import {
  ChangeVMStatusSchema,
  ClaimSOLSchema,
  DepinDeployVmSchema,
  DepinVerificationSchema,
  FindVmSchema,
  RegisterVMSchema,
} from "@decloud/types";
import {
  activateHostQueue,
  initialiseAccount,
  terminateDepinVMQueue,
} from "../redis";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { calculatePricePerHour } from "../utils/calculatePrice";

const depinVM = Router();
const ws = new WebSocket(process.env.DEPIN_WS_URL || "ws://localhost:8080");

depinVM.post("/findVM", authMiddleware, async (req, res) => {
  const userId = req.userId;
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
  const parseData = FindVmSchema.safeParse(req.body);
  if (!parseData.success) {
    res.status(400).json({
      error: "Invalid request body",
    });
    return;
  }
  try {
    const { cpu, ram, diskSize } = parseData.data;
    const findVm = await prisma.depinHostMachine.findFirst({
      where: {
        isActive: true,
        cpu: {
          gte: parseInt(cpu),
        },
        ram: {
          gte: parseInt(ram),
        },
        diskSize: {
          gte: parseInt(diskSize),
        },
        isOccupied: false,
      },
    });
    if (!findVm) {
      res.status(404).json({
        error: "No suitable VM found for deployment",
      });
      return;
    }

    res.status(200).json({
      message: "Deployment request sent successfully",
      vm: findVm,
    });
  } catch (error) {
    console.error("Error deploying image:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

depinVM.post("/deploy", authMiddleware, async (req, res) => {
  const userId = req.userId;
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
  const parseData = DepinDeployVmSchema.safeParse(req.body);
  if (!parseData.success) {
    res.status(400).json({
      error: "Invalid request body",
    });
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
      where: {
        id: VmId,
        isActive: true,
        isOccupied: false,
      },
    });
    if (!findVm) {
      res.status(404).json({
        error: "No suitable VM found for deployment",
      });
      return;
    }
    const txn = await prisma.$transaction(async (tx) => {
      // websocket connection to send job details
      ws.send(
        JSON.stringify({
          type: "start-job",
          jobId: id,
          dockerImage: dockerImage,
          ports: ports ? ports.split(",").map((port) => parseInt(port)) : [],
          env: envVars ? envVars.split(",") : [],
          machineId: findVm.id,
          token: jwt.sign(
            { id: userId, machineId: findVm.id },
            process.env.JWT_SECRET || "mysecret",
          ),
        }),
      );

      await prisma.depinHostMachine.update({
        where: {
          id: findVm.id,
        },
        data: {
          isOccupied: true,
        },
      });

      activateHostQueue.add("changeVMStatus", {
        id: findVm.id,
        userPubKey: findVm.userPublicKey,
        status: true,
      });

      const job = await terminateDepinVMQueue.add(
        "terminate-depin-vm",
        {
          pubKey: user.publicKey,
          id: findVm.id,
        },
        {
          delay: endTime * 60 * 1000,
        },
      );

      const config = await prisma.vMInstance.create({
        data: {
          id: id,
          name: appName,
          userId: userId!,
          jobId: job.id || findVm.id,
          status: "DEPLOYING",
          PaymentType: "ESCROW",
          region: findVm.region,
          ipAddress: findVm.ipAddress,
          endTime: new Date(Date.now() + Number(endTime) * 60 * 1000),
          provider: "LOCAL",
          price: escrowAmount,
          startTime: new Date(),
        },
      });

      await prisma.vMImage.create({
        data: {
          id: id,
          name: appName,
          description: description,
          dockerImage: dockerImage,
          cpu: parseInt(cpu),
          ram: parseInt(ram),
          diskSize: parseInt(diskSize),
          depinHostMachineId: findVm.id,
          os: findVm.os,
          applicationPort: Number(ports),
          envVariables: envVars ? envVars.split(",") : [],
          applicationUrl: `https://${config.id}-Axion.krishlabs.tech`,
        },
      });

      return config;
    });

    res.status(200).json({
      message: "Deployment request sent successfully",
      id: txn.id,
      name: txn.name,
    });
  } catch (error) {
    console.error("Error deploying image:", error);
    res.status(500).json({
      error: "Internal server error",
    });
    return;
  }
});

depinVM.delete("/terminate/:id", authMiddleware, async (req, res) => {
  const userId = req.userId;
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
  const vmId = req.params.id;
  const vmInstance = await prisma.vMInstance.findFirst({
    where: {
      id: vmId,
      userId: userId,
    },
    include: {
      VMImage: true,
    },
  });

  if (!vmInstance) {
    res.status(404).json({
      error: "VM instance not found",
    });
    return;
  }

  try {
    const txn = await prisma.$transaction(async (tx) => {
      ws.send(
        JSON.stringify({
          type: "end-job",
          jobId: vmId,
          machineId: vmInstance.VMImage?.depinHostMachineId,
          token: jwt.sign(
            { id: userId, machineId: vmInstance.VMImage?.depinHostMachineId },
            process.env.JWT_SECRET || "mysecret",
            { expiresIn: "5Mins" },
          ),
        }),
      );
      await prisma.vMInstance.update({
        where: {
          id: vmId,
        },
        data: {
          status: "TERMINATED",
        },
      });
      const depinHost = await prisma.depinHostMachine.update({
        where: {
          id: vmInstance.id,
        },
        data: {
          isOccupied: false,
        },
      });
      activateHostQueue.add("changeVMStatus", {
        id: depinHost.id,
        userPubKey: depinHost.userPublicKey,
        status: false,
      });
    });

    res.status(200).json({
      message: "Termination request sent successfully",
    });
  } catch (error) {
    console.error("Error terminating VM:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

depinVM.post("/depinVerification", async (req, res) => {
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

depinVM.post("/register", authMiddleware, async (req, res) => {
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

depinVM.post("/changeVisibility", authMiddleware, async (req, res) => {
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

depinVM.get("/getAll", authMiddleware, async (req, res) => {
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

depinVM.get("/getById", authMiddleware, async (req, res) => {
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

depinVM.post("/claimSOL", authMiddleware, async (req, res) => {
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

export default depinVM;
