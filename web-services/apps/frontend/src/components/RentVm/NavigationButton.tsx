import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../ui/dialog";
import { motion } from "motion/react";
import { toast } from "sonner";
import axios from "axios";
import { BACKEND_URL } from "@/config";

interface NavigationButtonProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  canProceedToStep2: string;
  isConfirmOpen: boolean;
  setIsConfirmOpen: (open: boolean) => void;
  costPerMin: number;
  duration: number;
  handlePayment: () => void;
  canProceedToStep3: boolean;
  paymentType: "duration" | "escrow";
  escrowAmount?: number;
}

export const NavigationButton = ({
  currentStep,
  setCurrentStep,
  canProceedToStep2,
  isConfirmOpen,
  setIsConfirmOpen,
  duration,
  handlePayment,
  canProceedToStep3,
  paymentType,
  escrowAmount = 0,
  costPerMin = 0,
}: NavigationButtonProps) => {
  return (
    <motion.div
      className="flex justify-between pt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Button
        variant="outline"
        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
        disabled={currentStep === 1}
        className="flex items-center space-x-2 cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back</span>
      </Button>

      {currentStep < 3 ? (
        <Button
          onClick={() => setCurrentStep(currentStep + 1)}
          disabled={currentStep === 1 ? !canProceedToStep2 : !canProceedToStep3}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <span>Continue</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      ) : (
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2 cursor-pointer">
              <Zap className="h-4 w-4" />
              <span>Deploy Instance</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deployment</DialogTitle>
              <DialogDescription>
                You're about to deploy your VM instance with the following{" "}
                {paymentType === "duration" ? "cost" : "escrow deposit"}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold font-mono mb-2">
                  {paymentType === "duration"
                    ? `≈ ${(Number(costPerMin) * duration).toFixed(3)} SOL`
                    : `Escrow Deposit: ${escrowAmount} SOL`}
                </div>
              </div>
              <Button
                className="w-full cursor-pointer"
                onClick={async () => {
                  const res = await axios.get(
                    `${BACKEND_URL}/user/checkTimeout`,
                    {
                      headers: {
                        Authorization: `${localStorage.getItem("token")}`,
                      },
                    },
                  );
                  if (res.data.error) {
                    toast.error(
                      "You can only create a VM once every 12 hours",
                      {
                        position: "bottom-right",
                      },
                    );
                    setIsConfirmOpen(false);
                    return;
                  }
                  handlePayment();
                }}
              >
                {paymentType === "duration"
                  ? "Confirm & Pay with Solana"
                  : "Create Escrow Contract"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};
