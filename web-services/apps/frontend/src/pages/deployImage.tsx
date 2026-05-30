import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Form } from "@/components/DeployImage/Form";
import { CostEstimation } from "@/components/DeployImage/CostEstimation";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import type { Machine } from "types/depinMachines";
import { PaymentGateway } from "@/components/DeployImage/PaymentGateway";

export function DeployApp() {
  const wallet = useWallet();
  const [vm, setVm] = useState<Machine>();
  const [escrowAmount, setEscrowAmount] = useState(0.1);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    appName: "",
    dockerImage: "",
    description: "",
    cpu: "",
    ram: "",
    diskSize: "",
    ports: "",
    envVars: "",
  });

  if (!wallet.publicKey || !localStorage.getItem("token")) {
    return (
      <div className="min-h-screen bg-[#F4F2F8] dark:bg-zinc-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-zinc-500 dark:text-zinc-500 text-sm mb-4">
            Sign in to deploy containers
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

  return (
    <div className="min-h-screen bg-[#F4F2F8] dark:bg-zinc-950 pt-28 pb-40 px-6 overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 40% 30% at 40% 5%, rgba(56,189,248,0.06), transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto">
        {/* header */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-10"
          >
            <span className="h-px w-6 bg-blue-400/60" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-zinc-500 dark:text-white/40">
              DePIN · Docker Deploy
            </span>
            {/* step indicator */}
            <div className="ml-auto flex items-center gap-3 text-[11px] font-mono">
              {["Configure", "Payment"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${step === i ? "bg-[#9945FF]" : step > i ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
                  />
                  <span
                    className={
                      step === i
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-400 dark:text-zinc-600"
                    }
                  >
                    {s}
                  </span>
                  {i === 0 && (
                    <span className="h-px w-6 bg-zinc-200 dark:bg-zinc-800" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-light leading-tight tracking-tight text-zinc-950 dark:text-white">
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                Deploy a container
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span
                className="block text-zinc-400 dark:text-zinc-600"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{
                  duration: 0.7,
                  delay: 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                on the DePIN network.
              </motion.span>
            </span>
          </h1>
        </div>

        {/* content — form + cost sidebar */}
        <div
          className={`transition-all duration-500 ${vm ? "grid lg:grid-cols-3 gap-8" : ""}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className={vm ? "lg:col-span-2" : ""}
            >
              {step === 0 && (
                <Form
                  formData={formData}
                  setFormData={setFormData}
                  setVm={setVm}
                  setStep={setStep}
                />
              )}
              {step === 1 && vm && (
                <PaymentGateway
                  escrowAmount={escrowAmount}
                  setEscrowAmount={setEscrowAmount}
                  vmId={vm.id}
                  form={formData}
                  PricePerHour={vm.PerHourPrice}
                  setVm={setVm}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {vm && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* cost sidebar header */}
                <div className="pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600">
                    Matched node · {vm.region}
                  </span>
                  <p className="text-sm font-mono text-emerald-500 mt-1">
                    {vm.PerHourPrice} SOL / hr
                  </p>
                </div>
                <CostEstimation PerHourPrice={vm.PerHourPrice || 0} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
