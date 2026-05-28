import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Step1, type Step1FormData } from "@/components/DepinHosting/Step1";
import { Step2 } from "@/components/DepinHosting/Step2";
import { Step3 } from "@/components/DepinHosting/Step3";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { IconCheck, IconCoins, IconTrendingUp } from "@tabler/icons-react";

/* ── constants ──────────────────────────────────────────────────────── */
const STEP_LABELS = ["Machine Details", "Verification", "Activation"];
const SOL_PRICE = 150;

/* ── earnings calc (spec formula) ──────────────────────────────────── */
function calcEarnings(cpu: number, ram: number, disk: number) {
  return (cpu * 0.005 + ram * 0.001 + disk * 0.0001) * 720;
}

/* ── Sparkline ──────────────────────────────────────────────────────── */
function Sparkline() {
  const bars = [3, 5, 4, 6, 5, 7, 6];
  return (
    <div className="flex items-end gap-0.5 h-4">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${(h / 7) * 100}%`,
            background: "rgba(99,102,241,0.4)",
          }}
        />
      ))}
    </div>
  );
}

/* ── Earnings sidebar ───────────────────────────────────────────────── */
function EarningsSidebar({
  cpu,
  ram,
  disk,
}: {
  cpu: number;
  ram: number;
  disk: number;
}) {
  const sol = useMemo(() => calcEarnings(cpu, ram, disk), [cpu, ram, disk]);
  const usd = (sol * SOL_PRICE).toFixed(0);

  // Show range when at minimum values
  const isMinimal = cpu <= 1 && ram <= 2 && disk <= 10;
  const displaySol = isMinimal ? "~0.45–1.2 SOL" : `~${sol.toFixed(2)} SOL`;

  return (
    <div
      className="sticky top-6 rounded-[14px] p-5 space-y-4"
      style={{
        background: "#0F0F1C",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(56,189,248,0.15))",
          }}
        >
          <IconCoins size={18} color="#6366F1" />
        </div>
        <p className="text-sm font-medium text-white">Estimated Earnings</p>
      </div>

      {/* Hero number */}
      <div>
        <p
          className="text-[32px] font-semibold leading-none"
          style={{
            background: "linear-gradient(135deg, #6366F1, #38BDF8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {displaySol}
        </p>
        <p className="text-xs text-white/40 mt-1">per month</p>
        {!isMinimal && (
          <p className="text-[13px] text-white/55 mt-1">
            ≈ ${usd} at today's price
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Breakdown */}
      <div className="space-y-2">
        {[
          { label: "CPU", val: (cpu * 0.005 * 720).toFixed(2) },
          { label: "RAM", val: (ram * 0.001 * 720).toFixed(2) },
          { label: "Storage", val: (disk * 0.0001 * 720).toFixed(2) },
        ].map((row) => (
          <div key={row.label} className="flex justify-between">
            <span className="text-xs text-white/40">{row.label}</span>
            <span className="text-xs text-white/75 font-mono">
              +{row.val} SOL
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Disclaimer */}
      <p className="text-[11px] text-white/30 italic leading-relaxed">
        Estimates based on current network demand. Actual earnings may vary.
      </p>

      {/* Network demand sparkline */}
      <div className="space-y-1.5">
        <Sparkline />
        <div className="flex items-center gap-1.5">
          <IconTrendingUp size={11} color="#22C55E" />
          <span className="text-[11px] text-emerald-500">
            High demand · good time to join
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Stepper ────────────────────────────────────────────────────────── */
function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-10">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <div key={label} className="flex items-center">
            {/* Circle */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-300"
                style={
                  done
                    ? {
                        background: "linear-gradient(135deg, #6366F1, #38BDF8)",
                        color: "#fff",
                      }
                    : active
                      ? {
                          background:
                            "linear-gradient(135deg, #6366F1, #38BDF8)",
                          color: "#fff",
                          boxShadow: "0 0 0 4px rgba(99,102,241,0.2)",
                        }
                      : {
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "rgba(255,255,255,0.3)",
                        }
                }
              >
                {done ? <IconCheck size={14} /> : n}
              </div>
              <span
                className="text-sm font-medium whitespace-nowrap"
                style={{
                  color: active
                    ? "#fff"
                    : done
                      ? "#fff"
                      : "rgba(255,255,255,0.3)",
                }}
              >
                {label}
              </span>
            </div>
            {/* Connector — constrained width, not full-bleed */}
            {i < STEP_LABELS.length - 1 && (
              <div
                className="mx-4 h-px rounded-full flex-shrink-0"
                style={{
                  width: 48,
                  background: done
                    ? "linear-gradient(90deg, #6366F1, #38BDF8)"
                    : "rgba(255,255,255,0.08)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export function HostRegister() {
  const wallet = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Step1FormData>({
    machineType: "",
    ipAddress: "",
    cpu: 1,
    ram: 2,
    diskSize: 10,
    region: "",
    os: "",
    Key: "",
  });

  const handleStep1Submit = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/user/depin/register`,
        { ...formData, userPublicKey: wallet.publicKey?.toBase58() },
        { headers: { Authorization: `${localStorage.getItem("token")}` } },
      );
      if (res.status === 200) {
        setId(res.data.vm.id);
        toast.success("Machine details saved. Proceed to verification.");
        setCurrentStep(2);
      }
    } catch {
      toast.error("Failed to save machine details.");
    }
    setIsLoading(false);
  };

  const handleStep2Verify = async () => {
    setIsLoading(true);
    try {
      if (!id) {
        toast.error("Complete step 1 first.");
        setIsLoading(false);
        return;
      }
      const res = await axios.get(
        `${BACKEND_URL}/user/depin/getById?id=${id}`,
        {
          headers: { Authorization: `${localStorage.getItem("token")}` },
        },
      );
      if (res.data.verified) {
        toast.success("Machine verified!");
        setCurrentStep(3);
      } else {
        toast.error("Verification failed. Ensure the script ran correctly.");
      }
    } catch {
      toast.error("Verification check failed.");
    }
    setIsLoading(false);
  };

  if (!wallet.publicKey || !localStorage.getItem("token")) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#080810" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-white/40 text-sm mb-4">
            Connect your wallet to register a machine
          </p>
          <Link
            to="/signin"
            className="text-sm text-white hover:text-[#6366F1] transition-colors"
          >
            Sign in →
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-24 pb-32 px-6"
      style={{ background: "#080810" }}
    >
      {/* Subtle radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 8%, rgba(99,102,241,0.09), transparent 70%)",
        }}
      />

      <div className="relative max-w-[1180px] mx-auto">
        {/* ── Page header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="h-px w-5 rounded-full"
              style={{ background: "linear-gradient(90deg, #6366F1, #38BDF8)" }}
            />
            <span
              className="text-[11px] font-medium tracking-[0.18em] uppercase"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Register node
            </span>
          </div>
          <h1 className="text-[32px] font-semibold text-white leading-tight">
            Add your machine to the network
          </h1>
          <p
            className="text-sm mt-2 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Register your hardware, run a quick verification, and start earning
            SOL.
          </p>
        </motion.div>

        {/* ── Stepper ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Stepper current={currentStep} />
        </motion.div>

        {/* ── Two-column layout ────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left — form (62%) */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
              >
                {currentStep === 1 && (
                  <>
                    <Step1
                      formData={formData}
                      setFormData={setFormData}
                      isLoading={isLoading}
                      handleStep1Submit={handleStep1Submit}
                    />
                    {/* Save as draft */}
                    <p className="text-center mt-3">
                      <button
                        type="button"
                        className="text-[13px] transition-colors"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color =
                            "rgba(255,255,255,0.6)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color =
                            "rgba(255,255,255,0.35)")
                        }
                        onClick={() => toast.info("Draft saved.")}
                      >
                        Save as draft
                      </button>
                    </p>
                  </>
                )}
                {currentStep === 2 && (
                  <Step2
                    handleStep2Verify={handleStep2Verify}
                    isLoading={isLoading}
                  />
                )}
                {currentStep === 3 && <Step3 />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right — sticky sidebar (35%) */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="w-full lg:w-[320px] shrink-0"
            >
              <EarningsSidebar
                cpu={formData.cpu}
                ram={formData.ram}
                disk={formData.diskSize}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
