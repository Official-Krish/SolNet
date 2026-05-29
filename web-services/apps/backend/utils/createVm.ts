import "dotenv/config";
import compute from "@google-cloud/compute";
import { generateKeyPairSync } from "crypto";
import sshpk from "sshpk";

const networkName = "global/networks/default";
const projectId = process.env.PROJECT_ID;

interface CreateInstanceResult {
  ipAddress: string | null | undefined;
  instanceId: string | null | undefined;
  privateKey: string;
  publicKey: string;
}

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "pkcs1", format: "pem" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
});

export async function createInstance(
  instanceName: string,
  zone: string,
  machineType: string,
  diskSizeGb: string,
  os: string,
): Promise<CreateInstanceResult> {
  const instancesClient = new compute.InstancesClient();
  const sshPublicKey = sshpk.parseKey(publicKey, "pem").toString("ssh");
  const sourceImage = getSourceImage(os);

  const [response] = await instancesClient.insert({
    instanceResource: {
      name: instanceName,
      disks: [
        {
          initializeParams: { diskSizeGb, sourceImage },
          autoDelete: true,
          boot: true,
          type: "PERSISTENT",
        },
      ],
      machineType: `zones/${zone}/machineTypes/${machineType}`,
      networkInterfaces: [
        {
          name: networkName,
          accessConfigs: [
            {
              name: "External NAT",
              type: "ONE_TO_ONE_NAT",
              networkTier: "PREMIUM",
            },
          ],
        },
      ],
      metadata: {
        items: [{ key: "ssh-keys", value: `Axion:${sshPublicKey}` }],
      },
      tags: { items: ["http-server", "https-server"] },
    },
    project: projectId,
    zone,
  });

  const operationsClient = new compute.ZoneOperationsClient();
  await operationsClient.wait({
    operation: response.name,
    project: projectId,
    zone,
  });

  const [instance] = await instancesClient.get({
    project: projectId,
    zone,
    instance: instanceName,
  });
  const networkInterface = instance.networkInterfaces?.[0];
  const ipAddress = networkInterface?.accessConfigs?.[0]?.natIP;
  const instanceId = instance.id?.toString();

  return { ipAddress, instanceId, privateKey, publicKey: sshPublicKey };
}

function getSourceImage(os: string): string {
  switch (os) {
    case "ubuntu-20.04":
      return "projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts";
    case "ubuntu-22.04":
      return "projects/ubuntu-os-cloud/global/images/family/ubuntu-2204-lts";
    case "ubuntu-18.04":
      return "projects/ubuntu-os-cloud/global/images/family/ubuntu-1804-lts";
    case "debian-11":
      return "projects/debian-cloud/global/images/family/debian-11";
    case "debian-10":
      return "projects/debian-cloud/global/images/family/debian-10";
    case "centos-7":
      return "projects/centos-cloud/global/images/family/centos-7";
    case "centos-8":
      return "projects/centos-cloud/global/images/family/centos-8";
    case "centos-stream-8":
      return "projects/centos-cloud/global/images/family/centos-stream-8";
    case "centos-stream-9":
      return "projects/centos-cloud/global/images/family/centos-stream-9";
    case "rocky-linux-8":
      return "projects/rocky-linux-cloud/global/images/family/rocky-linux-8";
    case "rocky-linux-9":
      return "projects/rocky-linux-cloud/global/images/family/rocky-linux-9";
    default:
      return "projects/ubuntu-os-cloud/global/images/family/ubuntu-2204-lts";
  }
}
