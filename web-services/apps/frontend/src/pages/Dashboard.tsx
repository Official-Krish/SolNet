import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Search, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { type VM } from "../../types/vm";
import { useWallet } from "@solana/wallet-adapter-react";
import { formatter } from "@/lib/FormatTime";
import { getVmDetails } from "@/lib/vm";
import { toast } from "sonner";
import { useIndexerEvents } from "@/lib/useIndexerEvents";

export function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [vms, setVMs] = useState<VM[]>([]);
  const navigate = useNavigate();
  const wallet = useWallet();

  // Real-time VM status updates from indexer
  useIndexerEvents({
    account: wallet.publicKey?.toBase58(),
    onEvent: (event) => {
      if (
        event.instruction === "end_rental_session" ||
        event.instruction === "finalise_rental_with_escrow" ||
        event.instruction === "force_terminate_rental"
      ) {
        const vmId = event.args?.id as string;
        if (vmId) {
          setVMs((prev) =>
            prev.map((vm) =>
              vm.id === vmId ? { ...vm, status: "DELETED" } : vm,
            ),
          );
          toast.info(`VM ${vmId.slice(0, 8)}... terminated on-chain`, {
            position: "bottom-right",
          });
        }
      }
      if (
        event.instruction === "transfer_to_vault_and_rent" ||
        event.instruction === "start_rental_with_escrow"
      ) {
        const vmId = event.args?.id as string;
        if (vmId) {
          setVMs((prev) =>
            prev.map((vm) =>
              vm.id === vmId ? { ...vm, status: "RUNNING" } : vm,
            ),
          );
        }
      }
    },
  });

  useEffect(() => {
    if (!wallet || !localStorage.getItem("token")) {
      return;
    }
    const getVMs = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/vmInstance/getAll`, {
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
          },
        });
        setVMs(res.data.vms);
      } catch (error) {
        console.error("Error fetching VMs:", error);
      }
    };
    getVMs();
  }, [wallet]);

  const filteredVMs = vms.filter((vm) => {
    const matchesSearch = vm.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || vm.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (!wallet.connected || !localStorage.getItem("token")) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-4">Please SignIn</h1>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet and signInto manage your virtual
            machines.
          </p>
          <Link to="/signin">
            <Button className="cursor-pointer">SignIn</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your cloud compute instances
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Link to="/rent">
            <Button className="mt-4 sm:mt-0 cursor-pointer dark:bg-white dark:hover:bg-gray-100">
              <Plus className="h-4 w-4 mr-2" />
              New VM
            </Button>
          </Link>
          <Link to="/docker/deploy">
            <Button className="mt-4 sm:mt-0 cursor-pointer dark:bg-white dark:hover:bg-gray-100">
              <Plus className="h-4 w-4 mr-2" />
              Deploy Image
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search VMs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {["all", "running", "stopped", "booting"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize cursor-pointer"
            >
              {status}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* VM List */}
      <div className="space-y-4">
        {filteredVMs.map((vm, index) => (
          <motion.div
            key={vm.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-300 cursor-poiner"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (vm.status === "RUNNING") {
                navigate(
                  vm.provider === "LOCAL"
                    ? `/depin/deployment/${vm.id}`
                    : `/vm/${vm.id}`,
                );
              } else {
                toast.info("This VM is not running.", {
                  position: "top-right",
                });
              }
            }}
          >
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="text-lg font-semibold truncate hover:text-primary transition-colors">
                    {vm.name}
                  </div>
                  <StatusBadge status={vm.status} />
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="block font-medium text-foreground">
                      {vm.region}
                    </span>
                    <span>Region</span>
                  </div>
                  <div>
                    <span className="block font-medium text-foreground">
                      {vm.VMConfig?.os || vm.VMImage?.os || "N/A"}
                    </span>
                    <span>Operating System</span>
                  </div>
                  <div>
                    <span className="block font-medium text-foreground">
                      {vm.provider === "LOCAL"
                        ? `${vm.VMImage?.cpu || 0}vCPUs • ${vm.VMImage?.ram || 0}Gb Ram`
                        : `${getVmDetails(vm.VMConfig?.machineType).cpu}vCPUs • ${getVmDetails(vm.VMConfig?.machineType).ram}Gb Ram`}
                    </span>
                    <span>Resources</span>
                  </div>
                  <div>
                    <span className="block font-medium text-foreground font-mono">
                      {Number(vm.price).toFixed(6)} SOL
                    </span>
                    <span>Rented for</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-center text-sm text-muted-foreground">
              <span>
                Created On: {formatter.format(new Date(vm.createdAt))}
              </span>
              {vm.provider !== "LOCAL" && (
                <span className="font-mono">Instance Id: {vm.instanceId}</span>
              )}
              {vm.provider === "LOCAL" && (
                <span className="font-mono">
                  Image Deployed: {vm.VMImage?.dockerImage}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredVMs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-muted-foreground mb-4">
            {searchQuery || filter !== "all"
              ? "No VMs match your criteria"
              : "No VMs created yet"}
          </div>
          <Link to="/rent">
            <Button className="cursor-pointer">Create your first VM</Button>
          </Link>
          <Link
            to="/docker/deploy"
            className="block mt-4 text-sm text-primary hover:underline"
          >
            Or deploy a custom docker image
          </Link>
        </motion.div>
      )}
    </div>
  );
}
