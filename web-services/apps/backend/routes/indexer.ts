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

      console.log(
        `[Indexer] Rental payment confirmed: user=${userPubKey} amount=${amount} duration=${durationSeconds}s id=${id}`,
      );
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

      console.log(
        `[Indexer] Escrow funded: user=${userPubKey} amount=${amount} id=${id}`,
      );
      break;
    }

    case "top_up_escrow": {
      const userPubKey = accounts[0];
      const amount = args?.amount as number;
      const id = args?.id as string;
      console.log(
        `[Indexer] Escrow topped up: user=${userPubKey} amount=${amount} id=${id}`,
      );
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
        console.log(`[Indexer] Rental ended: id=${id} user=${userPubKey}`);
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
        console.log(
          `[Indexer] Escrow finalized: id=${id} refund=${amount} user=${userPubKey}`,
        );
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
        console.log(`[Indexer] Force terminated: id=${id}`);
      }
      break;
    }

    case "fund_vault": {
      const amount = args?.amount as number;
      console.log(`[Indexer] Vault funded: amount=${amount} | tx=${signature}`);
      break;
    }

    case "withdraw_funds": {
      const amount = args?.amount as number;
      console.log(
        `[Indexer] Vault withdrawal: amount=${amount} | tx=${signature}`,
      );
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

      console.log(
        `[Indexer] Host registered: id=${id} name=${hostName} type=${machineType} os=${os} disk=${diskSize} rate=${solPerHour}`,
      );
      break;
    }

    case "activate_host": {
      const id = args?.id as string;
      const hostPubKey = accounts[1];

      const host = await prisma.depinHostMachine.findFirst({
        where: { userPublicKey: hostPubKey },
      });
      if (host) {
        await prisma.depinHostMachine.update({
          where: { id: host.id },
          data: { isActive: true },
        });
        console.log(`[Indexer] Host activated: id=${id} host=${hostPubKey}`);
      }
      break;
    }

    case "deactivate_host": {
      const id = args?.id as string;
      const hostPubKey = accounts[1];

      const host = await prisma.depinHostMachine.findFirst({
        where: { userPublicKey: hostPubKey },
      });
      if (host) {
        await prisma.depinHostMachine.update({
          where: { id: host.id },
          data: { isActive: false },
        });
        console.log(`[Indexer] Host deactivated: id=${id} host=${hostPubKey}`);
      }
      break;
    }

    case "penalize_host": {
      const id = args?.id as string;
      const hostPubKey = accounts[1];

      const host = await prisma.depinHostMachine.findFirst({
        where: { userPublicKey: hostPubKey },
      });
      if (host) {
        await prisma.depinHostMachine.update({
          where: { id: host.id },
          data: { isActive: false, verified: false },
        });
        console.log(`[Indexer] Host penalized: id=${id} host=${hostPubKey}`);
      }
      break;
    }

    case "claim_rewards": {
      const id = args?.id as string;
      const hostPubKey = accounts[0];
      console.log(
        `[Indexer] Rewards claimed: id=${id} host=${hostPubKey} | tx=${signature}`,
      );
      break;
    }

    default:
      console.log(`[Indexer] Unhandled: ${instruction}`);
  }
}

export default router;
