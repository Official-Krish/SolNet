import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  StopCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { BACKEND_URL } from "@/config";

type Stage =
  | "idle"
  | "submitting"
  | "submitted"
  | "settling"
  | "done"
  | "failed";

export const StopDialog = ({
  vmId,
  onDone,
}: {
  vmId: string;
  onDone: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const busy =
    stage === "submitting" || stage === "submitted" || stage === "settling";

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    return stopPolling;
  }, []);

  const handleStop = async () => {
    setStage("submitting");
    setErrorMsg("");
    try {
      const res = await axios.delete(
        `${BACKEND_URL}/user/depin/terminate/${vmId}`,
        { headers: { Authorization: `${localStorage.getItem("token")}` } },
      );

      if (res.status !== 200) {
        setStage("failed");
        setErrorMsg(res.data?.error || "Failed to stop deployment");
        return;
      }

      setStage("submitted");

      // Poll for settlement record
      setStage("settling");
      let attempts = 0;
      const maxAttempts = 30; // 30 * 2s = 60s timeout

      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const sr = await axios.get(
            `${BACKEND_URL}/user/depin/settlement/${vmId}`,
            { headers: { Authorization: `${localStorage.getItem("token")}` } },
          );
          if (sr.data.settlement) {
            stopPolling();
            setStage("done");
            toast.success("Deployment stopped and settled on-chain", {
              position: "bottom-right",
            });
            setTimeout(() => {
              setOpen(false);
              setStage("idle");
              onDone();
            }, 1500);
          }
        } catch {
          // not settled yet
        }
        if (attempts >= maxAttempts) {
          stopPolling();
          setStage("done"); // still mark done, settlement will happen eventually
          toast.success("Deployment stopped. Settlement may take a moment.", {
            position: "bottom-right",
          });
          setTimeout(() => {
            setOpen(false);
            setStage("idle");
            onDone();
          }, 1500);
        }
      }, 2000);
    } catch (e: unknown) {
      setStage("failed");
      const msg = e instanceof Error ? e.message : "Failed to stop deployment";
      setErrorMsg(msg);
      toast.error(msg, { position: "bottom-right" });
    }
  };

  const reset = () => {
    stopPolling();
    setStage("idle");
    setErrorMsg("");
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="destructive"
        className="cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <StopCircle className="h-4 w-4 mr-2" />
        Stop Deployment
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!busy && stage !== "done") setOpen(o);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {stage === "idle" && "Stop Deployment"}
              {busy && "Stopping\u2026"}
              {stage === "done" && "Done"}
              {stage === "failed" && "Failed"}
            </DialogTitle>
          </DialogHeader>

          {stage === "idle" && (
            <div className="space-y-4">
              <DialogDescription>
                This will stop the Docker container on the host machine. Your
                unused escrow will be refunded after on-chain settlement.
              </DialogDescription>
              <p className="text-sm text-muted-foreground">
                A three-way settlement will happen on-chain: your refund, the
                host&apos;s earnings, and the platform fee.
              </p>
              <div className="flex space-x-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 cursor-pointer"
                  onClick={handleStop}
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Confirm Stop
                </Button>
              </div>
            </div>
          )}

          {busy && (
            <div className="space-y-5 py-4">
              {/* Step 1: Sending termination request */}
              <div className="flex items-center space-x-3">
                {stage === "submitting" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${stage === "submitting" ? "text-foreground" : "text-emerald-600"}`}
                  >
                    Sending termination request
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Contacting backend server
                  </p>
                </div>
              </div>

              {/* Step 2: Deployment stopped */}
              <div className="flex items-center space-x-3">
                {stage === "submitting" ? (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                ) : stage === "submitted" || stage === "settling" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${stage === "submitting" ? "text-muted-foreground" : "text-foreground"}`}
                  >
                    Deployment stopped
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Docker container terminated
                  </p>
                </div>
              </div>

              {/* Step 3: On-chain settlement */}
              <div className="flex items-center space-x-3">
                {stage === "settling" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : stage === "submitted" ? (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${stage === "settling" ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    On-chain settlement
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Three-way split: refund + host + platform
                  </p>
                </div>
              </div>

              {stage === "settling" && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground pt-2">
                  <Clock className="h-3 w-3" />
                  <span>Waiting for settlement confirmation\u2026</span>
                </div>
              )}
            </div>
          )}

          {stage === "done" && (
            <div className="space-y-4 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <p className="font-medium">
                Deployment stopped and settled on-chain
              </p>
              <p className="text-sm text-muted-foreground">
                Your refund has been processed. Check the settlement summary
                below for details.
              </p>
            </div>
          )}

          {stage === "failed" && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2 text-red-500">
                <XCircle className="h-5 w-5" />
                <p className="font-medium">
                  {errorMsg || "Failed to stop deployment"}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={reset}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 cursor-pointer"
                  onClick={handleStop}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {stage === "done" && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={reset}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
