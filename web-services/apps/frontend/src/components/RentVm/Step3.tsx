import { motion } from "motion/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import type { VMTypes } from "types/vm";
import { operatingSystems, regions } from "@/lib/constants";
import { Separator } from "../ui/separator";

interface Step2Props {
  vmName: string;
  selectedVMConfig: VMTypes | null;
  diskSize: number;
  region: string;
  os: string;
  duration: number;
  paymentType: "duration" | "escrow";
  escrowAmount?: number;
}

export const Step3 = ({
  vmName,
  selectedVMConfig,
  diskSize,
  region,
  os,
  duration,
  paymentType,
  escrowAmount,
}: Step2Props) => {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>Configuration Summary</CardTitle>
            <CardDescription>
              Review your VM configuration before deployment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Instance Name
                </div>
                <div className="font-medium">{vmName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Machine Type
                </div>
                <div className="font-medium">
                  {selectedVMConfig?.machineType}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Region</div>
                <div className="font-medium">
                  {regions.find((r) => r.value === region)?.label}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">OS</div>
                <div className="font-medium">
                  {
                    operatingSystems.find((os_item) => os_item.value === os)
                      ?.label
                  }
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Payment Type
                </div>
                <div className="font-medium">
                  {paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}
                </div>
              </div>
              {paymentType === "duration" && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Duration
                  </div>
                  <div className="font-medium">{duration} Minutes</div>
                </div>
              )}
              {paymentType === "escrow" && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Escrow Amount
                  </div>
                  <div className="font-medium">{escrowAmount} SOL</div>
                </div>
              )}
            </div>

            {selectedVMConfig && (
              <>
                <Separator />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">
                      {Number(selectedVMConfig.cpu)}
                    </div>
                    <div className="text-sm text-muted-foreground">vCPUs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {Number(selectedVMConfig.ram)}
                    </div>
                    <div className="text-sm text-muted-foreground">GB RAM</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{diskSize}</div>
                    <div className="text-sm text-muted-foreground">
                      GB Disk Size
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
