import { motion } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Receipt, Clock, ExternalLink } from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { useEffect, useState } from "react";

interface SettlementData {
  hostEarned: number;
  platformFee: number;
  renterRefund: number;
  uptimeSeconds: number;
  totalSeconds: number;
  txSignature: string | null;
  createdAt: string;
}

export const SettlementSummary = ({ vmId }: { vmId: string }) => {
  const [settlement, setSettlement] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/user/depin/settlement/${vmId}`,
          { headers: { Authorization: `${localStorage.getItem("token")}` } },
        );
        setSettlement(res.data.settlement);
      } catch {
        /* not settled yet */
      }
      setLoading(false);
    };
    fetch();
  }, [vmId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          Loading settlement details&hellip;
        </CardContent>
      </Card>
    );
  }

  if (!settlement) return null;

  const uptimeMins = Math.floor(settlement.uptimeSeconds / 60);
  const spent = settlement.hostEarned + settlement.platformFee;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-emerald-500/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Settlement Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
              <div className="text-xl font-bold font-mono">
                {spent.toFixed(6)} SOL
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Refunded</div>
              <div className="text-xl font-bold font-mono text-emerald-500">
                {settlement.renterRefund.toFixed(6)} SOL
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Platform Fee</div>
              <div className="text-lg font-mono">
                {settlement.platformFee.toFixed(6)} SOL
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Uptime</span>
              </div>
              <div className="text-lg font-mono">
                {uptimeMins}m ({settlement.uptimeSeconds}s)
              </div>
            </div>
          </div>

          {settlement.txSignature && (
            <div className="pt-3 border-t text-xs text-muted-foreground flex items-center justify-between">
              <span>Settled on-chain</span>
              <a
                href={`https://solscan.io/tx/${settlement.txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center space-x-1"
              >
                <ExternalLink className="h-3 w-3" />
                <span>View on Solscan</span>
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
