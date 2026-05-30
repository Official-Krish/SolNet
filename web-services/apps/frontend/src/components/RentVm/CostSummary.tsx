import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calculateEscrowEndTime } from "@/lib/vm";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface CostSummaryProps {
  selectedVMConfig: { machineType: string } | null;
  costPerMin: number;
  duration: number;
  paymentType: "duration" | "escrow";
  escrowAmount: number;
  diskSize: number;
}

export const CostSummary = ({
  selectedVMConfig,
  costPerMin,
  duration,
  paymentType,
  escrowAmount,
  diskSize,
}: CostSummaryProps) => {
  const [escrowEndTime, setEscrowEndTime] = useState(0);

  useEffect(() => {
    const calculateEscrowDuration = async () => {
      if (paymentType === "escrow") {
        if (!selectedVMConfig) return;
        const endTime = await calculateEscrowEndTime(
          escrowAmount,
          selectedVMConfig.machineType,
          diskSize,
        );
        setEscrowEndTime(Number(endTime));
      }
    };
    calculateEscrowDuration();
  }, [paymentType, selectedVMConfig, escrowAmount, diskSize]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle>
            {paymentType === "duration" ? "Cost Summary" : "Escrow Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedVMConfig ? (
            <>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Instance ({selectedVMConfig.machineType})</span>
                  <span className="font-mono">
                    {(Number(costPerMin) * 60).toFixed(6)} SOL/hr
                  </span>
                </div>
                {paymentType === "duration" ? (
                  <div className="flex justify-between text-sm">
                    <span>Duration</span>
                    <span>{duration} Minutes</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span>Escrow Deposit</span>
                    <span>{escrowAmount?.toFixed(3)} SOL</span>
                  </div>
                )}
              </div>

              <Separator />

              <motion.div
                className="flex justify-between items-center text-lg font-bold"
                whileHover={{ scale: 1.02 }}
              >
                <span>
                  {paymentType === "duration" ? "Total Cost" : "Deposit Amount"}
                </span>
                <span className="font-mono">
                  {paymentType === "duration"
                    ? (Number(costPerMin) * duration).toFixed(6)
                    : escrowAmount}{" "}
                  SOL
                </span>
              </motion.div>

              {paymentType === "escrow" && selectedVMConfig && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground text-center">
                    <div>Estimated runtime:</div>
                    <div className="font-medium text-foreground">
                      {(escrowEndTime / 60).toFixed(2)} hours
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              Select a machine configuration to see pricing
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
