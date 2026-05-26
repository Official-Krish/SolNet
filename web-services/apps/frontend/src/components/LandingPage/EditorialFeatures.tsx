import { motion, useInView } from "motion/react";
import { useRef } from "react";

function DeployAnimation() {
  const steps = [
    "Initializing VM",
    "Allocating vCPU × 4",
    "Mounting 50GB SSD",
    "Binding SOL escrow",
    "Ready",
  ];
  return (
    <div className="font-mono text-xs space-y-2">
      {steps.map((s, i) => (
        <motion.div
          key={s}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.35, duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <motion.span
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.35 + 0.2 }}
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === steps.length - 1 ? "bg-emerald-500" : "bg-[#9945FF]"}`}
          />
          <span
            className={
              i === steps.length - 1
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-zinc-600 dark:text-zinc-400"
            }
          >
            {s}
            {i < steps.length - 1 && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  delay: i * 0.35,
                }}
              >
                ...
              </motion.span>
            )}
          </span>
          {i === steps.length - 1 && (
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.35 + 0.5 }}
              className="ml-auto text-emerald-600 dark:text-emerald-400"
            >
              ✓
            </motion.span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function EarningsAnimation() {
  const bars = [30, 45, 38, 62, 55, 78, 90, 72, 85, 95];
  return (
    <div className="flex items-end gap-1.5 h-16">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-sm bg-gradient-to-t from-emerald-500 to-emerald-400"
          initial={{ scaleY: 0, originY: 1 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
          style={{ height: `${h}%`, transformOrigin: "bottom" }}
        />
      ))}
    </div>
  );
}

interface FeatureBlockProps {
  label: string;
  heading: string;
  body: string;
  visual: React.ReactNode;
  reverse?: boolean;
  accent?: "purple" | "rose" | "mint" | "none";
}

const ACCENT_BG: Record<NonNullable<FeatureBlockProps["accent"]>, string> = {
  purple:
    "radial-gradient(ellipse 90% 60% at 50% 50%, rgba(153,69,255,0.10), transparent 70%)",
  rose: "radial-gradient(ellipse 90% 60% at 50% 50%, rgba(251,113,133,0.09), transparent 70%)",
  mint: "radial-gradient(ellipse 90% 60% at 50% 50%, rgba(20,184,166,0.10), transparent 70%)",
  none: "transparent",
};

function FeatureBlock({
  label,
  heading,
  body,
  visual,
  reverse,
  accent = "none",
}: FeatureBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className="relative">
      {accent !== "none" && (
        <div
          aria-hidden
          className="absolute inset-x-[-10%] inset-y-0 pointer-events-none -z-10"
          style={{ background: ACCENT_BG[accent], filter: "blur(20px)" }}
        />
      )}
      <div
        className={`grid md:grid-cols-2 gap-16 md:gap-24 items-center py-24 ${reverse ? "md:[direction:rtl]" : ""}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="[direction:ltr]"
        >
          <span className="text-xs tracking-widest text-[#9945FF] uppercase mb-4 block">
            {label}
          </span>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-light text-zinc-950 dark:text-white leading-[1.05] mb-6 tracking-tight whitespace-pre-line">
            {heading}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed max-w-sm">
            {body}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="[direction:ltr] bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]"
        >
          {visual}
        </motion.div>
      </div>
    </div>
  );
}

export default function EditorialFeatures() {
  return (
    <section className="border-t border-black/[0.06] dark:border-white/[0.06] bg-transparent px-6 max-w-6xl mx-auto">
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/15 to-transparent" />

      <FeatureBlock
        label="01 — Deploy"
        heading={"Deploy\nInstantly"}
        body="Spin up a VM in under 30 seconds. Choose AWS, GCP, or a DePIN host node near you. No credit card, no forms — just connect your wallet."
        accent="purple"
        visual={
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-zinc-400 dark:text-zinc-600 text-xs font-mono">
                vm-provision.log
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                ● LIVE
              </span>
            </div>
            <DeployAnimation />
          </div>
        }
      />

      <div className="h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/15 to-transparent" />

      <FeatureBlock
        label="02 — Pay"
        heading={"Pay with\nSOL"}
        body="Every second of compute billed on-chain. Smart contract escrow locks your funds and releases them as you use resources — with full transparency."
        accent="rose"
        visual={
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 dark:text-zinc-600 mb-2">
              <span>Transaction stream</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                Processing
              </span>
            </div>
            {[
              {
                from: "Wallet",
                to: "Escrow",
                amount: "0.42 SOL",
                status: "confirmed",
              },
              {
                from: "Escrow",
                to: "Provider",
                amount: "0.07 SOL",
                status: "pending",
              },
              {
                from: "Escrow",
                to: "Wallet",
                amount: "0.35 SOL",
                status: "queued",
              },
            ].map((tx, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="flex items-center gap-3 text-xs font-mono"
              >
                <span className="text-zinc-600 dark:text-zinc-400">
                  {tx.from}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-[#9945FF]/30 to-emerald-500/30 relative">
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#9945FF]"
                    animate={{ left: ["0%", "100%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      delay: i * 0.7,
                      ease: "linear",
                    }}
                  />
                </div>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {tx.to}
                </span>
                <span
                  className={`ml-2 ${tx.status === "confirmed" ? "text-emerald-600 dark:text-emerald-400" : tx.status === "pending" ? "text-[#9945FF]" : "text-zinc-400 dark:text-zinc-600"}`}
                >
                  {tx.amount}
                </span>
              </motion.div>
            ))}
          </div>
        }
        reverse
      />

      <div className="h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/15 to-transparent" />

      <FeatureBlock
        label="03 — Earn"
        heading={"Turn Idle\nHardware\ninto Revenue"}
        body="Register your machine on the DePIN network. Every VM hour served earns you SOL. Rewards streamed directly to your wallet, no intermediaries."
        accent="mint"
        visual={
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 dark:text-zinc-600 mb-2">
              <span>7-day earnings</span>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-emerald-600 dark:text-emerald-400"
              >
                +12.4 SOL
              </motion.span>
            </div>
            <EarningsAnimation />
            <div className="flex justify-between text-xs text-zinc-300 dark:text-zinc-700 font-mono mt-1">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
              <span>Today</span>
              <span></span>
              <span></span>
            </div>
          </div>
        }
      />
    </section>
  );
}
