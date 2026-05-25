import { Worker } from "bullmq";
import compute from "@google-cloud/compute";
import prisma from "@decloud/db";
import { redisConnection as connection } from "@decloud/utilities/redis";
import {
  activateHost,
  deActivateHost,
  endRentalSession,
  InitialiseHostPDA,
} from "./contract";

const projectId = process.env.PROJECT_ID;

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
        where: {
          id: id,
        },
        include: {
          VMImage: true,
        },
      });
      if (!findVm) {
        console.error(`No VM found with ID ${id}`);
        return;
      }

      ws.send(
        JSON.stringify({
          type: "end-job",
          machineId: findVm.id,
          jobId: findVm.VMImage?.id,
        }),
      );
      await endRentalSession(findVm.id, pubKey, true);
      await deActivateHost(findVm.id, findVm.userPublicKey);
    } catch (error) {
      console.error(
        `Error processing terminate depin VM job ${job.id}:`,
        error,
      );
    }
  },
  {
    connection,
  },
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
