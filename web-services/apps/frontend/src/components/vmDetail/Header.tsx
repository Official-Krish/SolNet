import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import type { VM } from "types/vm";
import { calculatePrice } from "@/lib/vm";
import { EndRentalSession, transferFromVault } from "@/lib/contract";
import { toast } from "sonner";
import { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { formatter } from "@/lib/FormatTime";
import { StatusBadge } from "@/components/StatusBadge";
import { FinalizeRentalWithEscrow } from "@/lib/Escrow";
import { useTxConfirm } from "@/lib/useTxConfirm";

type TxStatus = "idle" | "submitted" | "confirmed" | "failed";

const DELETE_LABEL: Record<TxStatus, string> = {
  idle: "Delete",
  submitted: "Waiting for chain…",
  confirmed: "Deleting from cloud…",
  failed: "Failed",
};

export const Header = ({ vm }: { vm: VM }) => {
  const wallet = useAnchorWallet();
  const { watch } = useTxConfirm(wallet?.publicKey?.toBase58());
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const navigate = useNavigate();

  const handleDelete = async () => {
    setTxStatus("submitted");

    let sig: string | null = null;

    if (vm.PaymentType === "DURATION") {
      const res = await EndRentalSession(vm.id, wallet!);
      sig = res?.signature ?? null;
    } else {
      const timeElapsed =
        (new Date().getTime() - new Date(vm.createdAt).getTime()) / (1000 * 60);
      const amount = await calculatePrice(
        vm.VMConfig.machineType,
        Number(vm.VMConfig.diskSize),
        timeElapsed,
      );
      const res = await FinalizeRentalWithEscrow(
        wallet!,
        vm.id,
        Number(amount),
      );
      sig = res?.signature ?? null;
    }

    if (!sig) {
      setTxStatus("failed");
      toast.error("Contract call failed", { position: "bottom-right" });
      return;
    }

    watch(sig, {
      onConfirmed: async () => {
        setTxStatus("confirmed");
        try {
          const res = await axios.delete(
            `${BACKEND_URL}/vmInstance/destroy?vmId=${vm.id}&instanceId=${vm?.instanceId}&zone=${vm?.region}`,
            { headers: { Authorization: `${localStorage.getItem("token")}` } },
          );
          if (res.status === 200) {
            if (res.data.remainingTime > 0) {
              const remainingPrice = await calculatePrice(
                vm.VMConfig.machineType,
                Number(vm.VMConfig.diskSize),
                res.data.remainingTime,
              );
              await transferFromVault(Number(remainingPrice), vm.id, wallet!);
            }
            toast.success("VM deleted successfully!", {
              position: "bottom-right",
            });
            navigate("/dashboard");
          } else {
            setTxStatus("failed");
            toast.error("Failed to delete VM", { position: "bottom-right" });
          }
        } catch {
          setTxStatus("failed");
          toast.error("Failed to delete VM", { position: "bottom-right" });
        }
      },
      onFailed: () => {
        setTxStatus("failed");
        toast.error("On-chain transaction failed", {
          position: "bottom-right",
        });
      },
    });
  };

  const busy = txStatus !== "idle" && txStatus !== "failed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center space-x-4 mb-4">
        <Link to="/dashboard">
          <Button variant="outline" className="cursor-pointer" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">{vm.name}</h1>
          <StatusBadge status={vm.status} />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="destructive"
            size="sm"
            className={`cursor-pointer ${busy ? "opacity-50" : ""}`}
            onClick={handleDelete}
            disabled={busy}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {DELETE_LABEL[txStatus]}
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground mt-2">
        Instance ID: {vm.instanceId} • Created at:{" "}
        {formatter.format(new Date(vm.createdAt))}
      </p>
    </motion.div>
  );
};
