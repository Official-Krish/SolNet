import z from "zod";

export const SignUpSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(50),
  publicKey: z.string(),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  publicKey: z.string(),
});

export const VmInstanceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  paymentType: z.enum(["DURATION", "ESCROW"]),
  price: z.number().positive(),
  region: z
    .enum([
      "asia-south2-c",
      "asia-south2-b",
      "us-central1-a",
      "europe-west1-b",
      "us-east1-b",
      "us-west1-a",
    ])
    .default("asia-south2-c"),
  provider: z.enum(["AWS", "AZURE", "GCP", "DIGITALOCEAN", "VULTR"]),
  os: z
    .enum([
      "ubuntu-20.04",
      "ubuntu-22.04",
      "debian-11",
      "ubuntu-18.04",
      "debian-10",
      "centos-7",
    ])
    .default("ubuntu-22.04"),
  machineType: z
    .enum(["e2-medium", "e2-small", "e2-micro", "e2-standard"])
    .default("e2-micro"),
  diskSize: z.string().default("10"),
  endTime: z.number(),
});

export const EscrowTopUpSchema = z.object({
  id: z.string(),
  amount: z.number().positive(),
  additionalEscrowDuration: z.number(),
});

export const RegisterVMSchema = z.object({
  machineType: z
    .enum(["e2-medium", "e2-small", "e2-micro", "e2-standard"])
    .default("e2-micro"),
  ipAddress: z.string(),
  cpu: z.number().int().positive(),
  ram: z.number().int().positive(),
  os: z
    .enum([
      "ubuntu-20.04",
      "ubuntu-22.04",
      "debian-11",
      "ubuntu-18.04",
      "debian-10",
      "centos-7",
    ])
    .default("ubuntu-22.04"),
  diskSize: z.number().int().positive(),
  region: z.string(),
  userPublicKey: z.string(),
  Key: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/),
});

export const ChangeVMStatusSchema = z.object({
  id: z.string(),
  pubKey: z.string(),
  status: z.boolean(),
  Key: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/),
});

export const ClaimSOLSchema = z.object({
  id: z.string(),
  pubKey: z.string(),
});

export const DepinVerificationSchema = z.object({
  os: z.string(),
  cpu_cores: z.union([z.number(), z.string()]).transform(Number),
  ram_gb: z.union([z.number(), z.string()]).transform(Number),
  disk_gb: z.union([z.number(), z.string()]).transform(Number),
  ip_address: z.string(),
  wallet: z.string(),
  key: z.string().min(1),
});

export const FindVmSchema = z.object({
  cpu: z.string().min(1).max(10),
  ram: z.string().min(1).max(10),
  diskSize: z.string().min(1).max(10),
});

export const DepinDeployVmSchema = z.object({
  appName: z.string().min(1).max(50),
  dockerImage: z.string().min(1).max(100),
  description: z.string().min(1).max(200),
  cpu: z.string().min(1).max(10),
  ram: z.string().min(1).max(10),
  diskSize: z.string().min(1).max(10),
  ports: z.string().min(1).max(50),
  envVars: z.string().optional(),
  escrowAmount: z.number().positive(),
  endTime: z.number(),
  VmId: z.string(),
  id: z.string(),
});
