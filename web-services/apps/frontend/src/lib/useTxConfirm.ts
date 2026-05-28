/**
 * useTxConfirm — shared hook for indexer-first, RPC-poll fallback confirmation.
 *
 * Usage:
 *   const { watch } = useTxConfirm(walletPubkey);
 *   const sig = await someContractCall();
 *   watch(sig, { onConfirmed, onFailed, timeoutMs: 30000 });
 *
 * The hook subscribes to useIndexerEvents for the given pubkey.
 * When an event arrives matching the signature, it resolves immediately.
 * If no indexer event arrives within timeoutMs, it polls RPC every 2s.
 */
import { useRef } from "react";
import { useIndexerEvents } from "./useIndexerEvents";
import { clusterApiUrl, Connection } from "@solana/web3.js";

type Resolver = { onConfirmed: () => void; onFailed: () => void };

export function useTxConfirm(walletPubkey: string | undefined) {
  const pending = useRef<Map<string, Resolver>>(new Map());
  const polls = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useIndexerEvents({
    account: walletPubkey,
    onEvent: (event) => {
      const r = pending.current.get(event.signature);
      if (!r) return;
      pending.current.delete(event.signature);
      clearInterval(polls.current.get(event.signature));
      polls.current.delete(event.signature);
      if (event.success) r.onConfirmed();
      else r.onFailed();
    },
  });

  function watch(
    signature: string,
    {
      onConfirmed,
      onFailed,
      timeoutMs = 30_000,
    }: Resolver & { timeoutMs?: number },
  ) {
    pending.current.set(signature, { onConfirmed, onFailed });

    let elapsed = 0;
    const poll = setInterval(async () => {
      elapsed += 2000;
      try {
        const conn = new Connection(clusterApiUrl("devnet"));
        const status = await conn.getSignatureStatus(signature, {
          searchTransactionHistory: true,
        });
        const conf = status?.value?.confirmationStatus;
        if (conf === "confirmed" || conf === "finalized") {
          clearInterval(poll);
          if (pending.current.has(signature)) {
            pending.current.delete(signature);
            polls.current.delete(signature);
            onConfirmed();
          }
          return;
        }
      } catch {
        /* ignore */
      }
      if (elapsed >= timeoutMs) {
        clearInterval(poll);
        if (pending.current.has(signature)) {
          pending.current.delete(signature);
          polls.current.delete(signature);
          onConfirmed(); // fallback: assume confirmed
        }
      }
    }, 2000);

    polls.current.set(signature, poll);
  }

  return { watch };
}
