import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Monitor } from "lucide-react";
import type { VM } from "types/vm";
import { copyToClipboard } from "@/lib/utils";

export const Sidebar = ({ vm }: { vm: VM }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start cursor-pointer"
            onClick={() => copyToClipboard(vm.ipAddress)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy IP Address
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start cursor-pointer"
            onClick={() => window.open(`/ssh/${vm.instanceId}`, "_blank")}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Open in Browser
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
