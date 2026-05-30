import { motion } from "motion/react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { type VM } from "../../types/vm";
import { useIndexerEvents } from "@/lib/useIndexerEvents";
import { DepinHeader } from "@/components/DepinDeployment/Header";
import { DeploymentInfo } from "@/components/DepinDeployment/DeploymentInfo";
import { HostInfo } from "@/components/DepinDeployment/HostInfo";
import { EscrowCard } from "@/components/DepinDeployment/EscrowCard";
import { StopDialog } from "@/components/DepinDeployment/StopDialog";
import { SettlementSummary } from "@/components/DepinDeployment/SettlementSummary";

export function DepinDeployment() {
  const wallet = useAnchorWallet();
  const { id } = useParams();
  const [vm, setVm] = useState<VM | null>(null);
  const [loading, setLoading] = useState(true);
  const isTerminated = vm?.status === "DELETED" || vm?.status === "TERMINATED";

  useIndexerEvents({
    account: wallet?.publicKey?.toBase58(),
    onEvent: (event) => {
      const eventId = event.args?.id as string;
      if (eventId !== id) return;
      if (
        event.instruction === "finalise_rental_with_escrow" ||
        event.instruction === "force_terminate_rental" ||
        event.instruction === "settle_depin_job"
      ) {
        setVm((prev) => (prev ? { ...prev, status: "TERMINATED" } : prev));
        toast.info("Deployment settled on-chain", { position: "bottom-right" });
      }
    },
  });

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/vmInstance/getDetails?id=${id}`,
          { headers: { Authorization: `${localStorage.getItem("token")}` } },
        );
        setVm(res.data.vmInstance);
      } catch {
        toast.error("Failed to load deployment details", {
          position: "bottom-right",
        });
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
        <p className="text-center text-muted-foreground">
          Loading deployment details...
        </p>
      </div>
    );
  }

  if (!vm) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-4">Deployment Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This deployment does not exist or has been removed.
          </p>
          <Link to="/dashboard">
            <Button className="cursor-pointer">Back to Dashboard</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!wallet || !localStorage.getItem("token")) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground mb-6">
            Connect your wallet and sign in to view your deployment.
          </p>
          <Link to="/signin">
            <Button className="cursor-pointer">Sign In</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
      <DepinHeader vm={vm} />

      {isTerminated && <SettlementSummary vmId={vm.id} />}

      {!isTerminated && (
        <>
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <DeploymentInfo vm={vm} />
            <HostInfo vm={vm} />
          </div>

          <div className="space-y-6">
            <EscrowCard vm={vm} />
            <div className="flex space-x-4">
              <StopDialog
                vmId={vm.id}
                onDone={() =>
                  setVm((p) => (p ? { ...p, status: "TERMINATED" } : p))
                }
              />
              <Link to="/dashboard">
                <Button variant="outline" className="cursor-pointer">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}

      {isTerminated && (
        <div className="mt-6">
          <Link to="/dashboard">
            <Button className="cursor-pointer">Back to Dashboard</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
