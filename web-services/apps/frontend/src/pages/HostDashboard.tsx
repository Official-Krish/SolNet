import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { type Machine } from "../../types/depinMachines";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate, Link } from "react-router-dom";
import { DashboardTable } from "@/components/DepinHostDashboard/Table";
import { useIndexerEvents } from "@/lib/useIndexerEvents";
import { toast } from "sonner";

export function HostDashboard() {
  const wallet = useWallet();
  const navigate = useNavigate();
  const [machines, setMachines] = useState<Machine[]>([]);

  useIndexerEvents({
    account: wallet.publicKey?.toBase58(),
    onEvent: (event) => {
      if (event.instruction === "activate_host") {
        const id = event.args?.id as string;
        setMachines((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isActive: true } : m)),
        );
        toast.success("Host activated on-chain", { position: "bottom-right" });
      }
      if (event.instruction === "deactivate_host") {
        const id = event.args?.id as string;
        setMachines((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isActive: false } : m)),
        );
        toast.info("Host deactivated", { position: "bottom-right" });
      }
      if (event.instruction === "penalize_host") {
        const id = event.args?.id as string;
        setMachines((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, isActive: false, verified: false } : m,
          ),
        );
        toast.error("Host penalized", { position: "bottom-right" });
      }
    },
  });

  useEffect(() => {
    if (!wallet.publicKey) return;
    axios
      .get(
        `${BACKEND_URL}/user/depin/getAll?userPublicKey=${wallet.publicKey.toBase58()}`,
        {
          headers: { Authorization: `${localStorage.getItem("token")}` },
        },
      )
      .then((r) => {
        if (r.status === 200) setMachines(r.data);
      })
      .catch(console.error);
  }, [wallet]);

  if (!wallet.publicKey || !localStorage.getItem("token")) {
    return (
      <div className="min-h-screen bg-[#F4F2F8] dark:bg-zinc-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-zinc-500 dark:text-zinc-500 text-sm mb-4">
            Sign in to view your host dashboard
          </p>
          <Link
            to="/signin"
            className="text-sm text-zinc-900 dark:text-white hover:text-[#9945FF] transition-colors"
          >
            Sign in →
          </Link>
        </motion.div>
      </div>
    );
  }

  const active = machines.filter((m) => m.isActive).length;
  const totalEarned = machines.reduce((s, m) => s + m.claimedSOL, 0);

  return (
    <div className="min-h-screen bg-[#F4F2F8] dark:bg-zinc-950 pt-28 pb-40 px-6 overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 40% 25% at 60% 5%, rgba(16,185,129,0.06), transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* header */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-10"
          >
            <span className="h-px w-6 bg-emerald-500/60" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-zinc-500 dark:text-white/40">
              Host Dashboard
            </span>
          </motion.div>

          <div className="flex items-end justify-between gap-6">
            <h1 className="text-4xl md:text-5xl font-light leading-tight tracking-tight text-zinc-950 dark:text-white">
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  Your nodes
                </motion.span>
              </span>
            </h1>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate("/depin/register")}
              className="shrink-0 inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors group pb-1"
            >
              Add machine
              <span className="group-hover:translate-x-0.5 transition-transform inline-block">
                →
              </span>
            </motion.button>
          </div>
        </div>

        {/* summary strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-12 mb-12 pb-8 border-b border-black/[0.06] dark:border-white/[0.06]"
        >
          {[
            { label: "Total machines", value: String(machines.length) },
            { label: "Active", value: String(active), accent: active > 0 },
            {
              label: "Total earned",
              value: `${totalEarned.toFixed(4)} SOL`,
              green: true,
            },
          ].map((s) => (
            <div key={s.label}>
              <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 block mb-1">
                {s.label}
              </span>
              <span
                className={`text-2xl font-light font-mono tabular-nums ${s.green ? "text-emerald-500" : "text-zinc-950 dark:text-white"}`}
              >
                {s.value}
              </span>
            </div>
          ))}
        </motion.div>

        {/* table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {machines.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm text-zinc-400 dark:text-zinc-600 mb-4">
                No machines registered yet.
              </p>
              <button
                onClick={() => navigate("/depin/register")}
                className="text-sm text-zinc-700 dark:text-zinc-300 hover:text-[#9945FF] transition-colors"
              >
                Register your first machine →
              </button>
            </div>
          ) : (
            <DashboardTable machines={machines} setMachines={setMachines} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
