import { motion } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Container, Globe, Variable } from "lucide-react";
import type { VM } from "types/vm";
import { copyToClipboard } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export const DeploymentInfo = ({ vm }: { vm: VM }) => {
  const img = vm.VMImage;
  if (!img) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Container className="h-5 w-5" />
            <span>Deployment Info</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Docker Image
              </div>
              <div className="font-mono text-sm">{img.dockerImage}</div>
            </div>
            {img.applicationUrl && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Application URL
                </div>
                <a
                  href={img.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-mono text-sm flex items-center space-x-1"
                >
                  <Globe className="h-3 w-3" />
                  <span>{img.applicationUrl}</span>
                </a>
              </div>
            )}
            {img.applicationPort && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Port</div>
                <div className="font-mono text-sm">{img.applicationPort}</div>
              </div>
            )}
            {img.os && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">OS</div>
                <div className="text-sm">{img.os}</div>
              </div>
            )}
          </div>

          {img.envVariables && img.envVariables.length > 0 && (
            <div>
              <div className="text-sm text-muted-foreground mb-2 flex items-center space-x-1">
                <Variable className="h-3 w-3" />
                <span>Environment Variables</span>
              </div>
              <div className="space-y-1">
                {img.envVariables.map((env, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5"
                  >
                    <code className="text-xs font-mono">{env}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 cursor-pointer"
                      onClick={() => copyToClipboard(env)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
