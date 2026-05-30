import { Worker } from "bullmq";
import compute from "@google-cloud/compute";
import prisma from "@axion/db";
import { redisConnection as connection } from "@axion/utilities/redis";
import {
  activateHost,
  claimRewards,
  deActivateHost,
  endRentalSession,
  InitialiseHostPDA,
  penalizeHost,
  settleDepinJob,
} from "./contract";

const projectId = process.env.PROJECT_ID;
const PLATFORM_VAULT_PUBKEY = process.env.PLATFORM_VAULT_PUBKEY || "";
const PLATFORM_FEE_BPS = Number(process.env.PLATFORM_FEE_BPS || "1000"); // default 10%

const ws = new WebSocket(process.env.WS_URL || "ws://localhost:8080");

const worker = new Worker(
  "vm-termination",
  async (job) => {
    console.log(
      `Processing job ${job.id} for VM instance with ID ${job.data.vmId}`,
    );
    try {
      const { instanceId, zone, pubKey, isEscrow, id } = job.data;
      const vmInstance = await prisma.vMInstance.findFirst({
        where: {
          id: id,
          instanceId: instanceId,
        },
      });
      if (!vmInstance) {
        return;
      }
      const txn = await endRentalSession(vmInstance.id, pubKey, isEscrow);
      if (!txn) {
        console.error(
          `Failed to end rental session for VM instance with ID ${instanceId}`,
        );
        return;
      }
      const operationDone = await deleteInstance(zone, instanceId);
      if (!operationDone) {
        console.error(`Failed to delete VM instance with ID ${instanceId}`);
        return;
      }
      await prisma.vMInstance.update({
        where: {
          id: id,
          instanceId: instanceId,
        },
        data: {
          status: "DELETED",
        },
      });
      console.log(
        `VM instance with ID ${instanceId} deleted and rental session ended successfully.`,
      );
    } catch (error) {
      console.error(`Error processing job ${job.data.vmId}:`, error);
    }
  },
  {
    connection,
  },
);

worker.on("completed", (job) => {
  console.log(`Job completed successfully: ${job.data.instanceId}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed: ${err.message}`);
});

const DepinWorker = new Worker(
  "initialise-host-pda",
  async (job) => {
    try {
      const {
        id,
        hostName,
        machineType,
        os,
        diskSize,
        pricePerHour,
        userPubKey,
      } = job.data;
      const tx = await InitialiseHostPDA(
        id,
        hostName,
        machineType,
        os,
        diskSize,
        pricePerHour,
        userPubKey,
      );
      if (!tx) {
        console.error(`Failed to initialise host PDA for job ${job.id}`);
        return;
      }
      console.log(`Host PDA initialised successfully for job ${job.id}:`, tx);
      await prisma.depinHostMachine.update({
        where: {
          id: id,
        },
        data: {
          pdaAddress: tx.hostMachinePda.toBase58(),
        },
      });
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
    }
  },
  {
    connection,
  },
);

DepinWorker.on("completed", (job) => {
  console.log(`Depin job completed successfully: ${job.id}`);
});
DepinWorker.on("failed", (job, err) => {
  console.error(`Depin job ${job?.id} failed: ${err.message}`);
});

const changeVmStatus = new Worker(
  "changeVMStatus",
  async (job) => {
    const { id, userPubKey, status } = job.data;
    try {
      status === false && (await deActivateHost(id, userPubKey));
      status === true && (await activateHost(id, userPubKey));
    } catch (error) {
      console.error(`Error processing deactivation job ${job.id}:`, error);
    }
  },
  {
    connection,
  },
);

changeVmStatus.on("completed", (job) => {
  console.log(`Deactivation job completed successfully: ${job.id}`);
});
changeVmStatus.on("failed", (job, err) => {
  console.error(`Deactivation job ${job?.id} failed: ${err.message}`);
});

const terminateDepinVm = new Worker(
  "terminate-depin-vm",
  async (job) => {
    const { pubKey, id } = job.data;

    try {
      const findVm = await prisma.depinHostMachine.findFirst({
        where: { id },
        include: { VMImage: true },
      });
      if (!findVm) {
        console.error(`No VM found with ID ${id}`);
        return;
      }

      // Find the VM instance to calculate uptime
      const vmInstance = await prisma.vMInstance.findFirst({
        where: { id: findVm.VMImage?.id },
      });

      // Skip if already settled (status already TERMINATED or DELETED)
      if (
        vmInstance &&
        vmInstance.status !== "DEPLOYING" &&
        vmInstance.status !== "RUNNING" &&
        vmInstance.status !== "BOOTING"
      ) {
        console.log(
          `VM ${vmInstance.id} already in state ${vmInstance.status}, skipping settlement`,
        );
        return;
      }

      // Send end-job to host agent (backend may have already sent it, idempotent)
      ws.send(
        JSON.stringify({
          type: "end-job",
          machineId: findVm.id,
          jobId: findVm.VMImage?.id,
        }),
      );

      if (vmInstance) {
        const uptimeMs = Date.now() - new Date(vmInstance.startTime).getTime();
        const uptimeHours = uptimeMs / (1000 * 60 * 60);
        const hostEarned = Math.floor(uptimeHours * findVm.perHourPrice * 1e9); // lamports
        const totalMs =
          new Date(vmInstance.endTime).getTime() -
          new Date(vmInstance.startTime).getTime();

        // Settle: host gets paid, platform gets cut, renter gets refund
        const tx = await settleDepinJob(
          vmInstance.id,
          pubKey,
          findVm.userPublicKey,
          hostEarned,
          PLATFORM_FEE_BPS,
          PLATFORM_VAULT_PUBKEY,
        );

        const platformFee = (hostEarned * PLATFORM_FEE_BPS) / 10000;
        const hostPayout = hostEarned - platformFee;
        const escrowLamports = vmInstance.price * 1e9;
        const renterRefund = Math.max(0, escrowLamports - hostEarned);

        await prisma.depinSettlement.create({
          data: {
            hostMachineId: findVm.id,
            renterPubKey: pubKey,
            jobId: vmInstance.id,
            hostEarned: hostPayout / 1e9,
            platformFee: platformFee / 1e9,
            renterRefund: renterRefund / 1e9,
            uptimeSeconds: Math.floor(uptimeMs / 1000),
            totalSeconds: Math.floor(totalMs / 1000),
            txSignature: tx,
          },
        });

        await prisma.vMInstance.update({
          where: { id: vmInstance.id },
          data: { status: "DELETED" },
        });
      }

      await prisma.depinHostMachine.update({
        where: { id: findVm.id },
        data: { isOccupied: false },
      });

      console.log(`DePIN job ${id} settled successfully`);
    } catch (error) {
      console.error(
        `Error processing terminate depin VM job ${job.id}:`,
        error,
      );
    }
  },
  { connection },
);

terminateDepinVm.on("completed", (job) => {
  console.log(`Terminate depin VM job completed successfully: ${job.id}`);
});
terminateDepinVm.on("failed", (job, err) => {
  console.error(`Terminate depin VM job ${job?.id} failed: ${err.message}`);
});

async function deleteInstance(zone: string, instanceId: string) {
  const instancesClient = new compute.InstancesClient();

  await instancesClient.delete({
    project: projectId,
    zone,
    instance: instanceId,
  });

  return true;
}

const claimRewardsWorker = new Worker(
  "claim-rewards",
  async (job) => {
    const { id, userPubKey } = job.data;
    try {
      const tx = await claimRewards(id, userPubKey);
      if (!tx) {
        console.error(`Failed to claim rewards for ${id}`);
        return;
      }
      console.log(`Rewards claimed for ${id}: ${tx}`);
    } catch (error) {
      console.error(`Error claiming rewards for ${id}:`, error);
    }
  },
  { connection },
);

claimRewardsWorker.on("completed", (job) => {
  console.log(`Claim rewards job completed: ${job.id}`);
});
claimRewardsWorker.on("failed", (job, err) => {
  console.error(`Claim rewards job ${job?.id} failed: ${err.message}`);
});

const penalizeHostWorker = new Worker(
  "penalize-host",
  async (job) => {
    const { id, userPubKey } = job.data;
    try {
      const tx = await penalizeHost(id, userPubKey);
      if (!tx) {
        console.error(`Failed to penalize host ${id}`);
        return;
      }
      console.log(`Host ${id} penalized: ${tx}`);
    } catch (error) {
      console.error(`Error penalizing host ${id}:`, error);
    }
  },
  { connection },
);

penalizeHostWorker.on("completed", (job) => {
  console.log(`Penalize host job completed: ${job.id}`);
});
penalizeHostWorker.on("failed", (job, err) => {
  console.error(`Penalize host job ${job?.id} failed: ${err.message}`);
});
