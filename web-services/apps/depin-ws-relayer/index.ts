import type { ServerWebSocket } from "bun";
import jwt, { type JwtPayload } from "jsonwebtoken";
import prisma from "@decloud/db";

interface Job {
    job_id: string;
    docker_image: string;
    ports?: number[];
    env?: Record<string, string>;
}

interface data {
    type: "start-job" | "end-job" | "job-status" | "SUBSCRIBE" | "UNSUBSCRIBE" | "status";
    jobId: string;
    dockerImage?: string;
    ports?: number[];
    env?: Record<string, string>;
    machineId?: string;
    token?: string;
    status?: "RUNNING" | "TERMINATING" | "DELETED" | "BOOTING" | "CREATING";
}

const activeConnections = new Map<string, ServerWebSocket<unknown>>();
const activeJobs = new Map<string, Job>();

Bun.serve({
    fetch(req, server) {
        if (server.upgrade(req)) {
            return;
        }
        return new Response("Upgrade failed", { status: 500 });
    },
    websocket: {
        async message(ws, message) {
            try {
                const data: data = JSON.parse(message.toString());

                if (data.type === "SUBSCRIBE") {
                    const verifiedToken = verifyToken(data.token || "");
                    activeConnections.set(verifiedToken.id, ws);
                    await prisma.depinHostMachine.update({
                        where: {
                            id: verifiedToken.id,
                        },
                        data: {
                            isActive: true,
                        }
                    });
                    return;
                }

                if (data.type === "UNSUBSCRIBE") {
                    const verifiedToken = verifyToken(data.token || "");
                    activeConnections.delete(verifiedToken.id);
                    activeJobs.delete(verifiedToken.id);
                    await prisma.depinHostMachine.update({
                        where: {
                            id: verifiedToken.id,
                        },
                        data: {
                            isActive: false,
                        }
                    });
                    return;
                }

                if (data.type === "start-job") {
                    const checkUser = verifyUser(data.token || "");
                    if (!checkUser) {
                        ws.send(JSON.stringify({
                            type: "error",
                            message: "Invalid token"
                        }));
                        return;
                    }
                    const job: Job = {
                        job_id: data.jobId,
                        docker_image: data.dockerImage || "",
                        ports: data.ports,
                        env: data.env,
                    };
                    const vm = activeConnections.get(data.machineId || "");
                    if (vm) {
                        vm.send(JSON.stringify({
                            type: "start-job",
                            jobId: data.jobId,
                            dockerImage: data.dockerImage,
                            ports: data.ports,
                            env: data.env,
                        }));
                        activeJobs.set(data.machineId || "", job);
                    }
                    return;
                }

                if (data.type === "end-job") {
                    const checkUser = verifyUser(data.token || "");
                    if (!checkUser) {
                        ws.send(JSON.stringify({
                            type: "error",
                            message: "Invalid token"
                        }));
                        return;
                    }
                    const job = activeJobs.get(data.jobId);
                    if (job) {
                        const vm = activeConnections.get(data.machineId || "");
                        if (vm) {
                            vm.send(JSON.stringify({
                                type: "end-job",
                                jobId: data.jobId,
                            }));
                            activeJobs.delete(data.jobId);
                        }
                    }
                    return;
                }

                if (data.type === "job-status") {
                    const job = activeJobs.get(data.jobId);
                    if (job) {
                        const vm = activeConnections.get(data.machineId || "");
                        if (vm) {
                            vm.send(JSON.stringify({
                                type: "job-status",
                                jobId: data.jobId,
                                dockerImage: job.docker_image,
                                ports: job.ports,
                                env: job.env,
                            }));
                        }
                    }
                    return;
                }

                if (data.type === "status") {
                    const verifiedToken = verifyToken(data.token || "");
                    await prisma.vMInstance.update({
                        where: {
                            id: data.jobId,
                        },
                        data: {
                            status: data.status,
                        }
                    });
                    return;
                }
            } catch (err) {
                console.error("Error processing WebSocket message:", err);
                ws.send(JSON.stringify({ type: "error", message: "Internal server error" }));
            }
        },
        open(ws) {
            ws.send(JSON.stringify({
                type: 'status',
                message: 'Connected to WebSocket.'
            }));
        },
        close(ws) {
            for (const [id, conn] of activeConnections) {
                if (conn === ws) {
                    activeConnections.delete(id);
                    activeJobs.delete(id);
                    prisma.depinHostMachine.update({
                        where: { id },
                        data: { isActive: false },
                    }).catch((err) => {
                        console.error("Error deactivating host on disconnect:", err);
                    });
                    break;
                }
            }
        },
    },
    port: 8080,
});

function verifyToken(token: string): { id: string; userPublicKey: string } {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in the environment variables");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    if (!decoded || typeof decoded === "string" || !decoded.id || !decoded.userPublicKey) {
        throw new Error("Invalid token payload");
    }
    return {
        id: decoded.id,
        userPublicKey: decoded.userPublicKey,
    };
}

function verifyUser(token: string): boolean {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in the environment variables");
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        if (!decoded || typeof decoded === "string" || !decoded.id || !decoded.machineId) {
            return false;
        }
        return true;
    } catch {
        return false;
    }
}
