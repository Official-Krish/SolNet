import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import type { VM } from "types/vm";
import { calculatePrice } from "@/lib/vm";
import { EndRentalSession, transferFromVault } from "@/lib/contract";
import { toast } from "sonner";
import { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { formatter } from "@/lib/FormatTime";
import { StatusBadge } from "@/components/StatusBadge";
import { FinalizeRentalWithEscrow } from "@/lib/Escrow";

export const Header = ({ vm }: { vm: VM }) => {
    const wallet = useAnchorWallet();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleDelete = async () => {
      if (vm.PaymentType === "DURATION") {
        await EndRentalSession(vm.id, wallet!)
      }
      else {
        const timeElapsed = (new Date().getTime() - new Date(vm.createdAt).getTime()) / (1000 * 60);
        const amount = await calculatePrice(vm?.VMConfig?.machineType!, Number(vm?.VMConfig?.diskSize), timeElapsed);
        await FinalizeRentalWithEscrow(wallet!, vm.id, Number(amount));
      }
        setLoading(true);
        try {
            const res = await axios.delete(`${BACKEND_URL}/vmInstance/destroy?vmId=${vm.id}&instanceId=${vm?.instanceId}&zone=${vm?.region}`, {
              headers: {
                Authorization: `${localStorage.getItem("token")}`,
              },
            });
            if (res.status === 200) {
              if(res.data.remainingTime > 0) {
                const remainingPrice = await calculatePrice(vm?.VMConfig?.machineType!, Number(vm?.VMConfig?.diskSize), res.data.remainingTime);
                await transferFromVault(Number(remainingPrice), vm?.id as string, wallet!);
              }
              setLoading(false);
              toast.success("VM deleted successfully!", {
                position: "bottom-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
              });
              navigate("/dashboard");
            } else {
              setLoading(false);
              toast.error("Failed to delete VM", {
                position: "bottom-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
              });
            }
        } catch (error) {
            console.error("Error deleting VM:", error);
        }
    };
    return (
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
          
          <div className="flex items-center space-x-2">
            
            <Button variant="destructive" size="sm" className={`cursor-pointer ${loading ? "opacity-50" : ""}`} 
              onClick={() => handleDelete()}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {loading ? "Deleting" : "Delete"}
            </Button>
          </div>
        </div>
        
        <p className="text-muted-foreground mt-2">
          Instance ID: {vm.instanceId} • Created at: {formatter.format(new Date(vm.createdAt))}
        </p>
      </motion.div>
    )
}