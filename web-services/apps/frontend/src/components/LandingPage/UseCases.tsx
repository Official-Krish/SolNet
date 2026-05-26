import { useRef } from "react";
import { motion, useInView } from "motion/react";

interface UseCase {
  quote: string;
  name: string;
  role: string;
  setup: string;
  initials: string;
  tint: string;
}

const CASES: UseCase[] = [
  {
    quote:
      "I rent 8× A100s for two hours, train a model, and pay 1.4 SOL. No quotas, no provisioning calls.",
    name: "Maya Chen",
    role: "ML Researcher · Stanford",
    setup: "8 GPUs · 96 vCPU · 768 GB RAM",
    initials: "MC",
    tint: "from-[#9945FF] to-indigo-500",
  },
  {
    quote:
      "Backend stack runs on a DePIN host in Frankfurt. 60% cheaper than AWS, settled in SOL every hour.",
    name: "Lukas Weber",
    role: "Founding Engineer · ledgerly.io",
    setup: "16 vCPU · 64 GB RAM · DePIN",
    initials: "LW",
    tint: "from-pink-500 to-rose-400",
  },
  {
    quote:
      "Two idle workstations earn me roughly 0.7 SOL a day. Setup took less than ten minutes.",
    name: "Sara Okafor",
    role: "DePIN Host · Lagos",
    setup: "Hosting · 24 vCPU · 128 GB",
    initials: "SO",
    tint: "from-emerald-500 to-teal-400",
  },
];

export default function UseCases() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="border-t border-black/[0.06] dark:border-white/[0.06] bg-transparent py-32 px-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20 max-w-2xl"
        >
          <span className="text-xs tracking-widest text-[#9945FF] uppercase mb-4 block">
            In production
          </span>
          <h2 className="text-4xl md:text-6xl font-light text-zinc-950 dark:text-white leading-tight tracking-tight">
            Built by people{" "}
            <span className="text-zinc-400 dark:text-zinc-600">
              who run real workloads.
            </span>
          </h2>
        </motion.div>

        {/* Editorial vignettes — no cards, just rhythm */}
        <div className="space-y-20 md:space-y-28">
          {CASES.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                delay: 0.2 + i * 0.15,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`grid md:grid-cols-12 gap-6 md:gap-12 items-start ${
                i % 2 === 1 ? "md:[direction:rtl]" : ""
              }`}
            >
              {/* Avatar */}
              <div className="md:col-span-2 [direction:ltr]">
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${c.tint} text-white font-medium flex items-center justify-center text-base shadow-[0_8px_24px_-8px_rgba(153,69,255,0.35)]`}
                >
                  {c.initials}
                </div>
              </div>

              {/* Quote + attribution */}
              <div className="md:col-span-10 [direction:ltr]">
                {/* Big editorial quote mark */}
                <div className="text-6xl text-[#9945FF]/15 leading-none -mb-4 select-none font-serif">
                  ❝
                </div>

                <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light text-zinc-900 dark:text-white leading-[1.25] tracking-tight max-w-3xl mb-6">
                  {c.quote}
                </blockquote>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <span className="text-zinc-950 dark:text-white font-medium">
                    {c.name}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-600">·</span>
                  <span className="text-zinc-500">{c.role}</span>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span className="font-mono text-zinc-500 text-xs">
                    {c.setup}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Subtle divider line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ delay: 0.8, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-28 h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent origin-center"
        />
      </div>
    </section>
  );
}
