import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Copy, Monitor } from "lucide-react";
import type { VM } from "types/vm";
import { Button } from "../ui/button";
import { copyToClipboard } from "@/lib/utils";
import { formatter } from "@/lib/FormatTime";

export const Overview = ({ vm }: { vm: VM }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>Instance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {vm.provider !== "LOCAL" && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Machine Type
                </Label>
                <div className="font-medium">{vm.VMConfig?.machineType}</div>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Zone</Label>
              <div className="font-medium">{vm.region}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Operating System
              </Label>
              <div className="font-medium">
                {vm.provider === "LOCAL"
                  ? vm.VMImage?.os
                  : vm.VMConfig?.os || "N/A"}
              </div>
            </div>
            {vm.provider !== "LOCAL" && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  IP Address
                </Label>
                <div className="font-mono text-sm flex items-center space-x-2">
                  <span>{vm.ipAddress}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(vm.ipAddress)}
                    className="h-6 w-6 p-0 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            {vm.provider === "LOCAL" && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Docker Image
                </Label>
                <div className="font-mono text-sm flex items-center space-x-2">
                  <span>{vm.VMImage?.dockerImage}</span>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Application URL
                  </Label>
                  <span>{vm.VMImage?.applicationUrl}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(vm.VMImage?.applicationUrl)}
                    className="h-6 w-6 p-0 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">End Time</Label>
              <div className="font-mono text-sm">
                {formatter.format(new Date(vm.endTime))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

function Label({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
