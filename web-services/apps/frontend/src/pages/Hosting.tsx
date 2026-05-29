import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";

const STEPS = [
  {
    n: "01",
    title: "Register your machine",
    desc: "Sign in with your Solana wallet, enter hardware specs — CPU, RAM, storage, region. Takes under 2 minutes.",
    cta: "Register now",
    href: "/depin/register",
  },
  {
    n: "02",
    title: "Run the verification script",
    desc: "One command installs the Axion node daemon and verifies your machine's resources on-chain.",
    code: "curl -sSL https://assets.krishlabs.tech/Axion/verification_script.sh | bash",
  },
  {
    n: "03",
    title: "Go live, earn SOL",
    desc: "Once verified and activated, your node appears in the DePIN pool. SOL accumulates every second compute is consumed.",
    cta: "View dashboard",
    href: "/depin/host/dashboard",
  },
];

export function Hosting() {
  const wallet = useWallet();

  if (!wallet.publicKey || !localStorage.getItem("token")) {
    return (
      <div className="min-h-screen bg-[#F4F2F8] dark:bg-zinc-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-zinc-500 dark:text-zinc-500 text-sm mb-4">
            Connect your wallet to continue
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
            "radial-gradient(ellipse 50% 40% at 50% 15%, rgba(16,185,129,0.07), transparent 70%)",
        }}
      />

      <div className="max-w-5xl mx-auto">
        {/* header */}
        <div className="mb-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-10"
          >
            <span className="h-px w-6 bg-emerald-500/60" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-zinc-500 dark:text-white/40">
              DePIN Hosting
            </span>
          </motion.div>

          <h1 className="text-[clamp(3rem,8vw,7rem)] font-light leading-[0.95] tracking-[-0.04em] text-zinc-950 dark:text-white">
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              >
                Your hardware.
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span
                className="block text-zinc-400 dark:text-zinc-600"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{
                  duration: 0.85,
                  delay: 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                Your SOL.
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-8 text-zinc-500 dark:text-zinc-400 text-lg font-light max-w-md"
          >
            Register idle compute on the Axion DePIN network. Earn SOL per
            second of workload served — no intermediaries.
          </motion.p>
        </div>

        {/* steps */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
              className="grid md:grid-cols-12 gap-6 py-12 border-b border-black/[0.05] dark:border-white/[0.05] last:border-0"
            >
              <div className="md:col-span-1">
                <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
                  {step.n}
                </span>
              </div>
              <div className="md:col-span-7">
                <h2 className="text-2xl font-light text-zinc-950 dark:text-white tracking-tight mb-3">
                  {step.title}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 font-light leading-relaxed mb-4">
                  {step.desc}
                </p>
                {step.code && (
                  <div className="font-mono text-xs bg-zinc-950 dark:bg-black/60 text-emerald-400 rounded-lg px-4 py-3 mt-4 flex items-center gap-3 overflow-x-auto">
                    <span className="text-zinc-600 shrink-0">$</span>
                    <span className="whitespace-nowrap">{step.code}</span>
                  </div>
                )}
              </div>
              <div className="md:col-span-4 flex md:justify-end items-start pt-1">
                {step.cta && (
                  <Link
                    to={step.href!}
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors group"
                  >
                    {step.cta}
                    <span className="group-hover:translate-x-0.5 transition-transform inline-block">
                      →
                    </span>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
