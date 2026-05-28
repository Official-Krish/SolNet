import { useRef } from "react";
import { motion, useInView } from "motion/react";

const FACTS = [
  {
    value: "< 30s",
    label: "VM boot time",
    sublabel: "From wallet sign to SSH access",
  },
  {
    value: "3",
    label: "Providers",
    sublabel: "AWS · GCP · DePIN bare-metal",
  },
  {
    value: "~400ms",
    label: "Avg settlement",
    sublabel: "Solana transaction finality",
  },
  {
    value: "Per-second",
    label: "Billing granularity",
    sublabel: "Pay only for what you use",
  },
];

export default function LiveMetrics() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section className="relative border-t border-black/[0.06] dark:border-white/[0.06] bg-transparent py-32 px-6 overflow-hidden">
      {/* Radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(153,69,255,0.07) 0%, transparent 70%)",
        }}
      />
      {/* Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(153,69,255,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.35,
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-0.5 h-4 bg-[#9945FF] rounded-full" />
            <span className="text-xs tracking-[0.14em] text-[#9945FF] uppercase">
              By the numbers
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-light text-zinc-950 dark:text-white max-w-lg leading-tight">
            Built for speed.{" "}
            <span className="text-zinc-400 dark:text-zinc-600">
              Settled on-chain.
            </span>
          </h2>
        </motion.div>

        <div className="h-px bg-black/[0.06] dark:bg-white/[0.08] mb-12" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          {FACTS.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="pl-4 border-l-2 border-[#9945FF]/40"
            >
              <div className="text-3xl md:text-4xl font-light text-zinc-950 dark:text-white tabular-nums mb-1">
                {f.value}
              </div>
              <p className="text-zinc-900 dark:text-white text-sm font-medium mb-0.5">
                {f.label}
              </p>
              <p className="text-zinc-500 text-xs">{f.sublabel}</p>
            </motion.div>
          ))}
        </div>

        {/* Activity bar — labeled as simulated */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-20 border-t border-b border-white/[0.15] dark:border-white/[0.15] py-5"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-600 mb-3">
            <span className="font-mono">Simulated network activity</span>
            <span className="text-amber-500 dark:text-amber-400 font-mono">
              DEVNET
            </span>
          </div>
          <div className="flex items-end gap-0.5 h-8">
            {Array.from({ length: 60 }).map((_, i) => (
              <motion.div
                key={i}
                className={`flex-1 rounded-full ${i % 7 !== 3 ? "bg-[#9945FF]" : "bg-amber-400"}`}
                animate={{ scaleY: [0.2, Math.random() * 0.8 + 0.2, 0.2] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5 + Math.random(),
                  delay: i * 0.02,
                  ease: "easeInOut",
                }}
                style={{ transformOrigin: "bottom" }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
