import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "@axion/db";

const router = Router();

const INDEXER_TOKEN = process.env.INDEXER_TOKEN || "changeme";

// Deduplication: track processed signatures (keeps last 1000)
const processedSigs = new Set<string>();
const MAX_SIGS = 1000;

function isDuplicate(signature: string): boolean {
  if (processedSigs.has(signature)) return true;
  processedSigs.add(signature);
  if (processedSigs.size > MAX_SIGS) {
    const first = processedSigs.values().next().value!;
    processedSigs.delete(first);
  }
  return false;
}

interface IndexerEvent {
  instruction: string;
  signature: string;
  accounts: string[];
  args: Record<string, string | number> | null;
  success: boolean;
  slot: number;
}

router.post("/webhook", async (req: Request, res: Response) => {
  const token = req.headers["x-indexer-token"];
  if (token !== INDEXER_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const event: IndexerEvent = req.body;

  if (!event.instruction || !event.signature) {
    res.status(400).json({ error: "Invalid event payload" });
    return;
  }

  if (isDuplicate(event.signature)) {
    res.status(200).json({ received: true, action: "duplicate_skipped" });
    return;
  }

  console.log(
    `[Indexer] ${event.instruction} | sig=${event.signature.slice(0, 16)}... | success=${event.success} | args=${JSON.stringify(event.args)}`,
  );

  if (!event.success) {
    res.status(200).json({ received: true, action: "skipped_failed_tx" });
    return;
  }

  try {
    await handleInstruction(event);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error(`[Indexer] Error handling ${event.instruction}:`, error);
    res.status(500).json({ error: "Failed to process event" });
  }
});

async function handleInstruction(event: IndexerEvent) {
  const { instruction, accounts, signature, args } = event;

  switch (instruction) {
    case "transfer_to_vault_and_rent": {
      // Payment confirmed on-chain for DURATION rental
      const userPubKey = accounts[0];
      const amount = args?.amount as number;
      const durationSeconds = args?.duration_seconds as number;
      const id = args?.id as string;

      if (id) {
        await prisma.vMInstance.updateMany({
          where: { id, user: { publicKey: userPubKey } },
          data: { status: "RUNNING" },
        });
      }
      break;
    }

    case "start_rental_with_escrow": {
      // Escrow funded on-chain
      const userPubKey = accounts[0];
      const amount = args?.amount as number;
      const id = args?.id as string;

      if (id) {
        await prisma.vMInstance.updateMany({
          where: { id, user: { publicKey: userPubKey } },
          data: { status: "RUNNING" },
        });
      }
      break;
    }

    case "top_up_escrow": {
      break;
    }

    case "end_rental_session": {
      const id = args?.id as string;
      const userPubKey = (args?.user_pub_key as string) || accounts[0];

      if (id) {
        await prisma.vMInstance.updateMany({
          where: { id, user: { publicKey: userPubKey } },
          data: { status: "TERMINATED" },
        });
      }
      break;
    }

    case "finalise_rental_with_escrow": {
      const id = args?.id as string;
      const amount = args?.amount as number;
      const userPubKey = accounts[0];

      if (id) {
        await prisma.vMInstance.updateMany({
          where: { id, user: { publicKey: userPubKey } },
          data: { status: "TERMINATED" },
        });
      }
      break;
    }

    case "force_terminate_rental": {
      const id = args?.id as string;
      if (id) {
        await prisma.vMInstance.updateMany({
          where: { id },
          data: { status: "TERMINATED" },
        });
      }
      break;
    }

    case "fund_vault": {
      break;
    }

    case "withdraw_funds": {
      break;
    }

    case "initialise_host_registration": {
      // accounts: [admin, user_key, host_machine_pda, system_program]
      const userPubKey = accounts[1];
      const id = args?.id as string;
      const hostName = args?.host_name as string;
      const machineType = args?.machine_type as string;
      const os = args?.os as string;
      const diskSize = args?.disk_size as number;
      const solPerHour = args?.sol_per_hour as number;

      const host = await prisma.depinHostMachine.findFirst({
        where: { userPublicKey: userPubKey },
      });

      if (host) {
        await prisma.depinHostMachine.update({
          where: { id: host.id },
          data: { pdaAddress: accounts[2] },
        });
      }
      break;
    }

    case "activate_host": {
      const hostPubKey = accounts[1];

      const host = await prisma.depinHostMachine.findFirst({
        where: { userPublicKey: hostPubKey },
      });
      if (host) {
        await prisma.depinHostMachine.update({
          where: { id: host.id },
          data: { isActive: true },
        });
      }
      break;
    }

    case "deactivate_host": {
      const hostPubKey = accounts[1];

      const host = await prisma.depinHostMachine.findFirst({
        where: { userPublicKey: hostPubKey },
      });
      if (host) {
        await prisma.depinHostMachine.update({
          where: { id: host.id },
          data: { isActive: false },
        });
      }
      break;
    }

    case "penalize_host": {
      const hostPubKey = accounts[1];

      const host = await prisma.depinHostMachine.findFirst({
        where: { userPublicKey: hostPubKey },
      });
      if (host) {
        await prisma.depinHostMachine.update({
          where: { id: host.id },
          data: { isActive: false, verified: false },
        });
      }
      break;
    }

    case "claim_rewards": {
      break;
    }

    case "settle_depin_job": {
      break;
    }

    default:
      console.log(`[Indexer] Unhandled: ${instruction}`);
  }
}

export default router;
