export interface VM {
  id: string;
  name: string;
  status: "RUNNING" | "TERMINATING" | "DELETED" | "BOOTING";
  region: string;
  price: string;
  createdAt: string;
  instanceId: string;
  ipAddress: string;
  endTime: Date;
  sshEnabled: true;
  provider: "AWS" | "GCP" | "AZURE" | "LOCAL";
  PaymentType: "DURATION" | "ESCROW";
  VMConfig: {
    os: string;
    machineType: string;
    diskSize: string;
  };
  VMImage: {
    id: string;
    name: string;
    description?: string;
    dockerImage: string;
    cpu: number;
    ram: number;
    diskSize: number;
    os: string;
    applicationPort: string;
    applicationUrl: string;
  };
}

export interface VMTypes {
  id: string;
  machineType: string;
  cpu: number;
  ram: number;
  description: string;
}

export interface FinalConfig {
  vmId: string;
  instanceId: string;
  ipAddress: string;
  privateKey: string;
  AuthToken: string;
}
