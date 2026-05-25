import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { type Machine } from "../../types/depinMachines";
import axios from "axios";
import { DEPIN_WORKER } from "@/config";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate, Link } from "react-router-dom";
import { DashboardTable } from "@/components/DepinHostDashboard/Table";
import { Plus } from "lucide-react";

export function HostDashboard() {
    const wallet = useWallet();
    const navigate = useNavigate();
    const [machines, setMachines] = useState<Machine[]>([]);

    useEffect(() => {
        const fetchMachines = async () => {
            try {
                if (!wallet || !wallet.publicKey) return;
                const res = await axios.get(`${DEPIN_WORKER}/depin/getAll?userPublicKey=${wallet.publicKey.toBase58()}`, {
                    headers: {
                        "Authorization": `${localStorage.getItem("token")}`
                    },
                });
                if (res.status === 200) {
                    setMachines(res.data);
                }
            } catch (error) {
                console.error("Error fetching machines:", error);
            }
        }   
        fetchMachines();
    }, [wallet]);

    
    if (!wallet || !localStorage.getItem("token")) {
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex items-center justify-center">
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
              >
                  <h1 className="text-3xl font-bold mb-4">Please SignIn</h1>
                  <p className="text-muted-foreground mb-6">Please connect your wallet and ensure you are signed in to proceed.</p>
                  <Link to="/signin">
                      <Button className="cursor-pointer">SignIn</Button>
                  </Link>
              </motion.div>
          </div>
        );
      }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-screen mt-20">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">
                            Host <span className="gradient-text">Dashboard</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Manage your DePIN compute nodes and track earnings
                        </p>
                    </div>
                    <Button 
                        className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:shadow-xl text-white cursor-pointer"
                        onClick={() => navigate('/depin/register')}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Machine
                    </Button>
                </div>
            </motion.div>


            {/* Machines Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DashboardTable machines={machines} setMachines={setMachines}/>
                
            </motion.div>
        </div>
    );
}