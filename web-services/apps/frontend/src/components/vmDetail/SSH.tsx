import type { VM } from "types/vm";
import { motion } from "motion/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Terminal, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/utils";

export const SSH = ({ vm }: { vm: VM }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Terminal className="h-5 w-5" />
            <span>SSH Access</span>
          </CardTitle>
          <CardDescription>Connect to your instance using SSH</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>SSH Commands</Label>
            </div>

            <div className="flex items-center space-x-2 justify-between bg-black rounded-lg mb-2">
              <div className="text-green-400 p-3 rounded font-mono text-sm">
                ssh-keygen -R {vm.ipAddress}
              </div>

              <div className="flex space-x-2">
                <Button
                  className="cursor-pointer"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(`ssh-keygen -R ${vm.ipAddress}`)
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2 justify-between bg-black rounded-lg mb-2">
              <div className="text-green-400 p-3 rounded font-mono text-sm">
                chmod 600 {vm.name}-key.pem
              </div>

              <div className="flex space-x-2">
                <Button
                  className="cursor-pointer"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(`chmod 600 ${vm.name}-key.pem`)
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2 justify-between bg-black rounded-lg">
              <div className="text-green-400 p-3 rounded font-mono text-sm">
                ssh -i {vm.name}-key.pem axion@{vm.ipAddress}
              </div>
              <div className="flex space-x-2">
                <Button
                  className="cursor-pointer"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `ssh -i ${vm.name}-key.pem axion@${vm.ipAddress}`,
                    )
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
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
