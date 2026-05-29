import "dotenv/config";
import compute from "@google-cloud/compute";

const projectId = process.env.PROJECT_ID;

export async function deleteInstance(zone: string, instanceId: string) {
  const instancesClient = new compute.InstancesClient();

  await instancesClient.delete({
    project: projectId,
    zone,
    instance: instanceId,
  });
  return true;
}
