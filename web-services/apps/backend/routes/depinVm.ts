import { Router } from "express";
import { authMiddleware } from "../utils/middleware";
import prisma from "@decloud/db";
import { DepinDeployVmSchema, FindVmSchema } from "@decloud/types";
import { activateHostQueue, terminateDepinVMQueue } from "../redis";
import jwt from "jsonwebtoken";

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
          applicationUrl: `https://${config.id}-solnet.krishdev.xyz`,
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

export default depinVM;
