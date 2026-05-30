import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { VM } from "types/vm";
import { StatusBadge } from "@/components/StatusBadge";
import { formatter } from "@/lib/FormatTime";

export const DepinHeader = ({
  vm,
  hostName,
}: {
  vm: VM;
  hostName?: string;
}) => (
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
    </div>
    <p className="text-muted-foreground mt-2">
      {vm.VMImage?.dockerImage} &middot; Created{" "}
      {formatter.format(new Date(vm.createdAt))}
      {hostName && <> &middot; Host: {hostName}</>}
    </p>
  </motion.div>
);
