import { motion } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Server, Cpu, HardDrive, MapPin } from "lucide-react";
import type { VM } from "types/vm";

export const HostInfo = ({ vm }: { vm: VM }) => {
  const img = vm.VMImage;
  if (!img) return null;

  const specs = [
    { label: "CPU", value: `${img.cpu} vCores`, icon: Cpu },
    { label: "RAM", value: `${img.ram} GB`, icon: HardDrive },
    { label: "Disk", value: `${img.diskSize} GB`, icon: HardDrive },
    { label: "Region", value: vm.region, icon: MapPin },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Host Machine</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vm.ipAddress && (
            <div className="mb-4 pb-4 border-b">
              <div className="text-sm text-muted-foreground mb-1">
                IP Address
              </div>
              <div className="font-mono text-sm">{vm.ipAddress}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {specs.map((s) => (
              <div key={s.label}>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-1">
                  <s.icon className="h-3 w-3" />
                  <span>{s.label}</span>
                </div>
                <div className="text-sm font-medium">{s.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
