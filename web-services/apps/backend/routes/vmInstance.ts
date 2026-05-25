require("dotenv").config();
import { Router } from "express";
import { authMiddleware } from "../utils/middleware";
import { VmInstanceSchema } from "@decloud/types";
import prisma from "@decloud/db";
import { createInstance } from "../utils/createVm";
import { deleteInstance } from "../utils/delteVm";
import compute from '@google-cloud/compute';
import { vmQueue } from "../redis";
import jwt from "jsonwebtoken";

const vmInstance = Router();
const instancesClient = new compute.InstancesClient();

vmInstance.post("/create", authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(400).json({
            error: "User ID is required",
        });
        return;
    }
    const parsedBody = VmInstanceSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({
            error: "Invalid request body",
        });
        return;
    }

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

    if (user.timeoutAt) {
        const userTimeout = new Date().getTime() - new Date(user.timeoutAt).getTime();
        const twelveHoursInMilliseconds = 12 * 60 * 60 * 1000;

        if (userTimeout < twelveHoursInMilliseconds) {
            res.status(403).json({
                error: "You can only create a VM once every 12 hours",
            });
            return;
        }
    }

    try {
        const { name, region, price, provider, os, machineType, diskSize, id, paymentType } = parsedBody.data;
        const endTime = 10;
        const existingVm = await prisma.vMInstance.findFirst({
            where: {
                name,
                userId,
                status: {
                    not: "DELETED"
                }
            }
        });
    
        if (existingVm) {
            res.status(409).json({
                error: "VM with this name already exists",
            });
            return;
        }
        const response = await createInstance(name, region, machineType, "10", os);

        const transaction = await prisma.$transaction(async (tx) => {
            const job = await vmQueue.add("terminate-vm", { 
                instanceId: response.instanceId, 
                zone: region,
                pubKey: user.publicKey,
                isEscrow: paymentType === "ESCROW",
                id: id,
            }, {
                delay: endTime * 60 * 1000,
            });
            const vm = await prisma.vMInstance.create({
                data: {
                    id: id,
                    name,
                    jobId: job.id || id,
                    PaymentType: paymentType,
                    region,
                    ipAddress: response.ipAddress,
                    endTime: new Date(Date.now() + Number(endTime) * 60 * 1000),
                    price,
                    provider,
                    startTime: new Date(),
                    userId,
                    instanceId: response.instanceId as unknown as string ?? "unknown",
                    publicKey: response.publicKey,
                    status: "RUNNING",
                }
            });
            await prisma.vMConfig.create({
                data: {
                    os,
                    machineType,
                    diskSize: diskSize,
                    vmId: vm.id,
                }
            });
            await prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    timeoutAt: new Date(),
                }
            });
            return {
                vm,
                instanceId: response.instanceId,
                ipAddress: response.ipAddress,
                privateKey: response.privateKey,
            };
        });

        const AuthToken = jwt.sign({
            userId,
            allowedVms: transaction.vm.ipAddress,
            privateKey: transaction.privateKey,
        }, process.env.JWT_SECRET || "my-secret", {
            expiresIn: Math.floor(Number(endTime) * 60 * 1000),
        });
        
        res.status(200).json({
            message: "VM instance created successfully",
            vmId: transaction.vm.id,
            instanceId: transaction.instanceId,
            ip: transaction.ipAddress,
            AuthToken: AuthToken,
            PrivateKey: transaction.privateKey,
        });
    } catch (error) {
        console.error("Error during VM instance creation:", error);
        res.status(500).json({
            error: "Internal server error",
        });
    }
})

vmInstance.get("/pollStatus", authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(400).json({  
            error: "User ID is required",
        });
        return;
    }
    const instanceId = req.query.instanceId as string;
    const vmId = req.query.id as string;
    if (!instanceId || !vmId) {
        res.status(400).json({
            error: `ID is required`,
        });
        return;
    }

    try {
        const vmInstance = await prisma.vMInstance.findUnique({
            where: {
                id: vmId,
                instanceId: instanceId,
            },
        });
        if (!vmInstance) {
            res.status(404).json({
                error: "VM instance not found",
            });
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
            res.status(404).json({
                error: "VM instance not found",
            });
            return;
        }

        await prisma.vMInstance.update({
            where: {
                id: vmId,
                instanceId: instanceId,
            },
            data: {
                status: status,
            }
        });
        res.status(200).json({
            vmId,
            status,
        });
    } catch(e) {
        console.error("Error during VM status polling:", e);
        res.status(500).json({
            error: "Internal server error",
        });
    }

});

vmInstance.delete("/destroy", authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {  
        res.status(400).json({
            error: "User ID is required",
        });
        return;
    }
    const instanceId = req.query.instanceId as string;
    const vmId = req.query.vmId as string;
    const zone = req.query.zone as string;
    if (!instanceId || !vmId || !zone) {
        res.status(400).json({
            error: "instance Id, VM ID, and zone are required",
        });
        return;
    }

    try {
        const vmInstance = await prisma.vMInstance.findFirst({
            where: {
                id: vmId,
                instanceId: instanceId,
            },
        });
        if (!vmInstance) {
            res.status(404).json({
                error: "VM instance not found",
            });
            return;
        }
        const remainingTime = vmInstance.endTime.getTime() - Date.now();
        await deleteInstance(zone, instanceId);

        await prisma.vMInstance.update({
            where: {
                id: vmId,
                instanceId: instanceId,
            },
            data: {
                status: "DELETED",
            }
        });

        res.status(200).json({
            message: "VM instance deleted successfully",
            remainingTime: remainingTime > 0 ? remainingTime : 0,
        });
    } catch (error) {
        console.error("Error during VM instance deletion:", error);
        res.status(500).json({
            error: "Internal server error",
        });
    }
});

vmInstance.get("/getAll", authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(400).json({
            error: "User ID is required",
        });
        return;
    }
    try {
        const vms = await prisma.vMInstance.findMany({
            where: {
                userId,
            },
            include: {
                VMConfig: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.status(200).json({
            vms,
        });
    } catch (error) {
        console.error("Error fetching VM instances:", error);
        res.status(500).json({
            error: "Internal server error",
        });
    }
});

vmInstance.get("/getDetails", authMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(400).json({
            error: "User ID is required",   
        });
        return;
    }
    const id = req.query.id as string;
    if (!id) {
        res.status(400).json({  
            error: "VM ID is required",
        });
        return;
    }

    try {
        const vmInstance = await prisma.vMInstance.findFirst({
            where: {
                id: id,
            },
            include: {
                VMConfig: true,
            },
        });
        if (!vmInstance) {
            res.status(404).json({
                error: "VM instance not found",
            });
            return;
        }
        res.status(200).json({
            vmInstance,
        });
    } catch (error) {
        console.error("Error fetching VM instance details:", error);
        res.status(500).json({
            error: "Internal server error",
        });
    }
});

export default vmInstance;