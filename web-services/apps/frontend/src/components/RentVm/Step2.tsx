import { motion } from "motion/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import type { VMTypes } from "types/vm";
import { Clock, FileText, Shield, Wallet } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { calculateEscrowEndTime } from "@/lib/vm";
import { useEffect, useState } from "react";

interface Step2Props {
  selectedVMConfig: VMTypes | null;
  paymentType: "duration" | "escrow";
  duration: number | undefined;
  setDuration: (duration: number) => void;
  setPaymentType: (type: "duration" | "escrow") => void;
  escrowAmount: number;
  setEscrowAmount: (amount: number) => void;
  diskSize: number;
}

export const Step2 = ({
  selectedVMConfig,
  paymentType,
  duration,
  escrowAmount,
  diskSize,
  setDuration,
  setPaymentType,
  setEscrowAmount,
}: Step2Props) => {
  const [escrowDuration, setEscrowDuration] = useState(0);

  useEffect(() => {
    const calculateEscrowDuration = async () => {
      if (paymentType === "escrow") {
        if (!selectedVMConfig) return;
        const endTime = await calculateEscrowEndTime(
          escrowAmount,
          selectedVMConfig.machineType,
          diskSize,
        );
        setEscrowDuration(Number(endTime));
      }
    };
    calculateEscrowDuration();
  }, [paymentType, selectedVMConfig, escrowAmount, diskSize]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Payment Method</span>
          </CardTitle>
          <CardDescription>
            Choose how you want to pay for your VM instance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={paymentType}
            onValueChange={(value: "duration" | "escrow") =>
              setPaymentType(value)
            }
          >
            <motion.div
              className={`flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                paymentType === "duration"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
              whileHover={{ scale: 1.01 }}
              onClick={() => setPaymentType("duration")}
            >
              <RadioGroupItem value="duration" id="duration" className="mt-1" />
              <div className="flex-1">
                <Label className="flex items-center space-x-2 cursor-pointer">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Fixed Duration Payment</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Pay upfront for a specific duration. Instance stops when time
                  expires.
                </p>
                {paymentType === "duration" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4"
                  >
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={duration}
                      placeholder="Enter duration in minutes"
                      onChange={(e) =>
                        setDuration && setDuration(parseInt(e.target.value))
                      }
                      className="mt-2 w-33"
                    />
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div
              className={`flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                paymentType === "escrow"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
              onClick={() => setPaymentType("escrow")}
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
                  Deposit funds in escrow. Usage is deducted automatically. Top
                  up anytime.
                </p>
                {paymentType === "escrow" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 space-y-3"
                  >
                    <div>
                      <Label>Initial Escrow Amount (SOL)</Label>
                      <Input
                        type="number"
                        min={0.00001}
                        value={escrowAmount}
                        onChange={(e) =>
                          setEscrowAmount(parseFloat(e.target.value))
                        }
                        placeholder="Enter amount in SOL"
                        className="my-4 w-32"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        ≈{" "}
                        {selectedVMConfig
                          ? (escrowDuration / 60).toFixed(2)
                          : 0}{" "}
                        hours of runtime
                      </p>
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
                  </motion.div>
                )}
              </div>
            </motion.div>
          </RadioGroup>
        </CardContent>
      </Card>
    </motion.div>
  );
};
