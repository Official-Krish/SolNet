import { useEffect, useRef, useState } from "react";
import { WS_RELAYER_URL } from "@/config";

export interface IndexerEvent {
  instruction: string;
  signature: string;
  accounts: string[];
  args: Record<string, string | number> | null;
  success: boolean;
  slot: number;
}

type EventHandler = (event: IndexerEvent) => void;

// ── Singleton WS state ────────────────────────────────────────────────
let globalWs: WebSocket | null = null;
const listeners = new Set<EventHandler>();
// All pubkeys that have been requested — re-subscribed on every (re)connect
const subscribedPubkeys = new Set<string>();
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function sendSubscribe(pubkey: string) {
  if (globalWs?.readyState === WebSocket.OPEN) {
    globalWs.send(JSON.stringify({ type: "subscribe-indexer", pubkey }));
  }
}

function connect() {
  if (globalWs?.readyState === WebSocket.OPEN) {
    return;
  }
  // If CONNECTING but we have pubkeys waiting, let it finish — onopen will subscribe them
  if (globalWs?.readyState === WebSocket.CONNECTING) {
    return;
  }

  globalWs = new WebSocket(WS_RELAYER_URL);

  globalWs.onopen = () => {
    for (const pk of subscribedPubkeys) sendSubscribe(pk);
  };

  globalWs.onmessage = (msg) => {
    try {
      const parsed = JSON.parse(msg.data as string);
      if (parsed.type === "indexer-event" && parsed.data) {
        listeners.forEach((fn) => fn(parsed.data));
      } else {
        console.warn("[ws-indexer] unknown message:", parsed);
      }
    } catch {
      console.error("[ws-indexer] failed to parse message:", msg.data);
      // ignore malformed
    }
  };

  globalWs.onclose = () => {
    globalWs = null;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 3000);
  };

  globalWs.onerror = (e) => {
    console.error("[ws-indexer] error:", e);
    globalWs?.close();
  };
}

function addPubkey(pubkey: string) {
  subscribedPubkeys.add(pubkey);
  if (globalWs?.readyState === WebSocket.OPEN) {
    sendSubscribe(pubkey);
  } else if (globalWs?.readyState === WebSocket.CONNECTING) {
    // onopen will subscribe all pubkeys in the set — nothing to do
  } else {
    connect();
  }
}

function removePubkey(pubkey: string) {
  subscribedPubkeys.delete(pubkey);
}

function disconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (globalWs?.readyState === WebSocket.CONNECTING) {
    return;
  }
  globalWs?.close();
  globalWs = null;
  subscribedPubkeys.clear();
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useIndexerEvents(opts?: {
  instruction?: string;
  account?: string;
  onEvent?: EventHandler;
}) {
  const [lastEvent, setLastEvent] = useState<IndexerEvent | null>(null);
  const onEventRef = useRef(opts?.onEvent);
  onEventRef.current = opts?.onEvent;

  useEffect(() => {
    // Don't connect until we have a pubkey to subscribe with
    if (opts?.account) addPubkey(opts.account);
    else return; // wallet not ready yet — effect will re-run when account arrives

    const handler: EventHandler = (event) => {
      if (opts?.instruction && event.instruction !== opts.instruction) return;
      setLastEvent(event);
      onEventRef.current?.(event);
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
      if (opts?.account) {
        removePubkey(opts.account);
        if (listeners.size === 0 && subscribedPubkeys.size === 0) disconnect();
      }
    };
  }, [opts?.instruction, opts?.account]);

  return lastEvent;
}

export function usePaymentConfirmation(
  vmId: string | null,
  expectedInstruction?: string,
) {
  const [status, setStatus] = useState<"pending" | "confirmed" | "failed">(
    "pending",
  );

  useIndexerEvents({
    instruction: expectedInstruction,
    onEvent: (event) => {
      if (!vmId) return;
      if (event.args?.id === vmId) {
        setStatus(event.success ? "confirmed" : "failed");
      }
    },
  });

  return status;
}
