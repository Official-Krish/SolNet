import { motion } from "motion/react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { type VM } from "../../types/vm";
import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Header } from "@/components/vmDetail/Header";
import { Sidebar } from "@/components/vmDetail/Sidebar";
import { Overview } from "@/components/vmDetail/Overview";
import { Hardware } from "@/components/vmDetail/Hardware";
import { SSH } from "@/components/vmDetail/SSH";
import { BillingStatus } from "@/components/vmDetail/BillingStatus";
import { useIndexerEvents } from "@/lib/useIndexerEvents";
import { toast } from "sonner";

export function VMDetails() {
  const wallet = useAnchorWallet();
  const { id } = useParams();
  const [vm, setVm] = useState<VM>();

  // Real-time status updates for this VM
  useIndexerEvents({
    account: wallet?.publicKey?.toBase58(),
    instruction: undefined,
    onEvent: (event) => {
      const eventId = event.args?.id as string;
      if (eventId !== id) return;

      if (
        event.instruction === "end_rental_session" ||
        event.instruction === "finalise_rental_with_escrow" ||
        event.instruction === "force_terminate_rental"
      ) {
        setVm((prev) => (prev ? { ...prev, status: "DELETED" } : prev));
        toast.info("VM terminated on-chain", { position: "bottom-right" });
      }
      if (event.instruction === "top_up_escrow") {
        toast.success(`Escrow topped up: ${event.args?.amount} lamports`, {
          position: "bottom-right",
        });
      }
    },
  });

  useEffect(() => {
    const fetchVMDetails = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/vmInstance/getDetails?id=${id}`,
          {
            headers: {
              Authorization: `${localStorage.getItem("token")}`,
            },
          },
        );
        setVm(response.data.vmInstance);
      } catch (error) {
        console.error("Error fetching VM details:", error);
      }
    };

    fetchVMDetails();
  }, [id]);

  if (!vm) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-muted-foreground">
          Loading VM details...
        </p>
      </div>
    );
  }

  if (vm.status === "DELETED") {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-4">VM Deleted</h1>
          <p className="text-muted-foreground mb-6">
            This virtual machine has been deleted.
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-4">Please SignIn</h1>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet and ensure you are signed in to proceed.
          </p>
          <Link to="/signin">
            <Button className="cursor-pointer">SignIn</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
      {/* Header */}
      <Header vm={vm} />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {vm.PaymentType === "ESCROW" && <BillingStatus vm={vm} />}
          <Overview vm={vm} />
          <Hardware vm={vm} />
          {vm.provider != "LOCAL" && <SSH vm={vm} />}
        </div>

        {/* Sidebar */}
        <Sidebar vm={vm} />
      </div>
    </div>
  );
}
