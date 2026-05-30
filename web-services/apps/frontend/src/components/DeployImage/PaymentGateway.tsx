import { motion } from "motion/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { FileText, Loader2, Shield, Wallet } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Button } from "../ui/button";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { useNavigate } from "react-router-dom";
import type { Machine } from "types/depinMachines";
import { StartRentalSessionWithEscrow } from "@/lib/Escrow";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

type TxStatus = "idle" | "submitted" | "confirmed" | "failed";

interface PaymentGatewayProps {
  escrowAmount: number;
  setEscrowAmount: (amount: number) => void;
  form: {
    appName: string;
    dockerImage: string;
    description: string;
    cpu: string;
    ram: string;
    diskSize: string;
    ports: string;
    envVars: string;
  };
  vmId?: string;
  PricePerHour: number;
  setVm: React.Dispatch<React.SetStateAction<Machine | undefined>>;
}

const STATUS_LABEL: Record<TxStatus, string> = {
  idle: "Processing payment…",
  submitted: "Transaction submitted, waiting for confirmation…",
  confirmed: "Confirmed! Deploying…",
  failed: "Transaction failed",
};

export const PaymentGateway = ({
  escrowAmount,
  setEscrowAmount,
  form,
  vmId,
  PricePerHour,
}: PaymentGatewayProps) => {
  const navigate = useNavigate();
  const wallet = useAnchorWallet();
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const loading = txStatus !== "idle";

  const handlePayment = async () => {
    setDialogOpen(false);

    const id = crypto.randomUUID().substring(0, 32);
    setTxStatus("submitted");

    const txn = await StartRentalSessionWithEscrow(wallet!, escrowAmount, id);
    if (!txn?.success || !txn.signature) {
      setTxStatus("failed");
      toast.error("Failed to start rental session with escrow.");
      return;
    }

    setTxStatus("confirmed");

    try {
      const endTime =
        PricePerHour > 0
          ? Math.max(1, Math.floor((escrowAmount / PricePerHour) * 60))
          : 60; // default 60 minutes if price not set
      const res = await axios.post(
        `${BACKEND_URL}/user/depin/deploy`,
        {
          ...form,
          escrowAmount,
          endTime,
          VmId: vmId,
          id,
          ports: form.ports.split(",").map((p) => p.trim()),
        },
        { headers: { Authorization: `${localStorage.getItem("token")}` } },
      );
      if (res.status === 200) {
        toast.success("Payment successful! Your VM is being deployed.");
      } else {
        toast.error("Payment confirmed but deployment failed.");
      }
    } catch {
      toast.error("Payment confirmed but deployment failed.");
    }
    navigate("/dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 h-screen"
    >
      {!loading && (
        <Card>
          <CardHeader className="mb-8">
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Payment Method</span>
            </CardTitle>
            <CardDescription>
              Choose how you want to pay for your VM instance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 mt-6">
            <RadioGroup>
              <motion.div
                className="flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer"
                whileHover={{ scale: 1.01 }}
              >
                <RadioGroupItem value="escrow" id="escrow" className="mt-1" />
                <div className="flex-1">
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Escrow Contract</span>
                    <div className="text-xs dark:bg-neutral-800 p-1 px-2 rounded-xl">
                      Recommended
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Deposit funds in escrow. Usage is deducted automatically.
                    Top up anytime.
                  </p>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 space-y-3"
                  >
                    <div>
                      <Label>Initial Escrow Amount (SOL)</Label>
                      <Input
                        type="number"
                        min={0.1}
                        value={escrowAmount}
                        onChange={(e) =>
                          setEscrowAmount(parseFloat(e.target.value))
                        }
                        placeholder="Enter amount in SOL"
                        className="my-4 w-32"
                      />
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          Escrow Contract Benefits:
                        </span>
                      </div>
                      <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-6">
                        <li>• Automatic usage deduction</li>
                        <li>• No service interruption</li>
                        <li>• Transparent billing</li>
                        <li>• Instant top-up capability</li>
                      </ul>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => setDialogOpen(true)}
                        disabled={escrowAmount < 0.1}
                        className="px-4 py-2 transition cursor-pointer"
                      >
                        Pay {escrowAmount} SOL
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center space-y-3 h-64">
          {txStatus !== "failed" && (
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          )}
          <span
            className={`text-lg ${txStatus === "failed" ? "text-red-500" : ""}`}
          >
            {STATUS_LABEL[txStatus]}
          </span>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deployment</DialogTitle>
            <DialogDescription>
              You're about to deploy your docker image.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                Escrow Deposit: {escrowAmount} SOL
              </div>
            </div>
            <Button className="w-full cursor-pointer" onClick={handlePayment}>
              Confirm & Pay with Solana
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
