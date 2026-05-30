import { motion } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TopUpEscrowSession } from "@/lib/Escrow";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { useTxConfirm } from "@/lib/useTxConfirm";
import type { VM } from "types/vm";

type TxStatus = "idle" | "submitted" | "confirmed" | "failed";

export const EscrowCard = ({ vm }: { vm: VM }) => {
  const wallet = useAnchorWallet();
  const { watch } = useTxConfirm(wallet?.publicKey?.toBase58());
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0.1);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");

  const handleTopUp = async () => {
    if (amount < 0.1) {
      toast.error("Minimum top up amount is 0.1 SOL", {
        position: "top-right",
      });
      return;
    }
    setTxStatus("submitted");
    try {
      const tx = await TopUpEscrowSession(wallet!, vm.id, amount);
      if (!tx?.signature) {
        setTxStatus("failed");
        toast.error("Top-up transaction failed", { position: "top-right" });
        return;
      }
      watch(tx.signature, {
        onConfirmed: async () => {
          try {
            await axios.post(
              `${BACKEND_URL}/vm/topup`,
              { id: vm.id, instanceId: vm.instanceId, amount },
              {
                headers: { Authorization: `${localStorage.getItem("token")}` },
              },
            );
            toast.success("Escrow topped up!", { position: "top-right" });
          } catch {
            toast.error("On-chain confirmed but backend update failed", {
              position: "top-right",
            });
          }
          setOpen(false);
          setTxStatus("idle");
        },
        onFailed: () => {
          setTxStatus("failed");
          toast.error("Top-up failed on-chain", { position: "top-right" });
        },
      });
    } catch {
      setTxStatus("failed");
      toast.error("Failed to top up escrow", { position: "top-right" });
    }
  };

  const busy = txStatus === "submitted";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Escrow Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold font-mono">{vm.price} SOL</div>
              <div className="text-sm text-muted-foreground">Deposited</div>
            </div>
            <Dialog
              open={open}
              onOpenChange={(o) => {
                if (!busy) setOpen(o);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="cursor-pointer"
                  disabled={
                    vm.status === "DELETED" || vm.status === "TERMINATED"
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Top Up
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Top Up Escrow</DialogTitle>
                  <DialogDescription>
                    Add funds to continue running your deployment.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Amount (SOL)</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.001"
                      value={amount}
                      onChange={(e) =>
                        setAmount(parseFloat(e.target.value) || 0.1)
                      }
                      className="mt-2"
                      disabled={busy}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold font-mono">
                      {amount.toFixed(3)} SOL
                    </div>
                  </div>
                  {txStatus === "failed" && (
                    <p className="text-xs text-red-500 text-center">
                      Transaction failed
                    </p>
                  )}
                  <Button
                    className="w-full cursor-pointer"
                    onClick={handleTopUp}
                    disabled={busy}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                        Confirming&hellip;
                      </>
                    ) : (
                      "Confirm Top Up"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
