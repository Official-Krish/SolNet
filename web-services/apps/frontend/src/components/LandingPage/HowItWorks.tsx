import { useRef } from "react";
import { motion, useInView } from "motion/react";

interface DetailRow {
  k: string;
  v: string;
  accent?: boolean;
  mono?: boolean;
  muted?: boolean;
}

const STEPS: {
  num: string;
  title: string;
  body: string;
  detail: DetailRow[];
}[] = [
  {
    num: "01",
    title: "Configure",
    body: "Pick vCPU, memory, storage, and region. Cost updates live in SOL as you drag.",
    detail: [
      { k: "vCPU", v: "4 cores" },
      { k: "RAM", v: "16 GB" },
      { k: "Storage", v: "100 GB SSD" },
      { k: "Region", v: "us-east-1" },
      { k: "Cost", v: "0.42 SOL / 24h", accent: true },
    ],
  },
  {
    num: "02",
    title: "Pay with SOL",
    body: "Connect your wallet. Funds lock into a smart contract escrow — released per second as you compute.",
    detail: [
      { k: "Wallet", v: "Connected" },
      { k: "Escrow", v: "0.42 SOL locked" },
      { k: "Billing", v: "Per-second", accent: false },
      { k: "Status", v: "Active", accent: true },
    ],
  },
  {
    num: "03",
    title: "SSH in",
    body: "VM boots in under 30 seconds. Connect via SSH or the browser terminal and ship.",
    detail: [
      { k: "$", v: "ssh root@vm-7f2a.solnet.io", mono: true },
      { k: "→", v: "Connecting...", mono: true, muted: true },
      { k: "✓", v: "Ready", mono: true, accent: true },
    ],
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="border-t border-black/[0.06] dark:border-white/[0.06] bg-transparent py-28 px-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <span className="text-xs tracking-widest text-[#9945FF] uppercase mb-4 block">
            How it works
          </span>
          <h2 className="text-4xl md:text-6xl font-light text-zinc-950 dark:text-white leading-tight tracking-tight">
            Zero to production.
            <br />
            <span className="text-zinc-400 dark:text-zinc-600">
              Three steps.
            </span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-px bg-black/[0.06] dark:bg-white/[0.06] rounded-2xl overflow-hidden">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                delay: 0.15 + i * 0.12,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm p-8 flex flex-col gap-6"
            >
              {/* Step number */}
              <span className="text-[11px] font-mono text-[#9945FF] tracking-widest">
                {step.num}
              </span>

              {/* Title + body */}
              <div>
                <h3 className="text-xl font-medium text-zinc-950 dark:text-white mb-2 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed">
                  {step.body}
                </p>
              </div>

              {/* Detail block */}
              <div className="mt-auto pt-6 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2">
                {step.detail.map((row, j) => (
                  <motion.div
                    key={j}
                    initial={{ opacity: 0, x: -6 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{
                      delay: 0.4 + i * 0.12 + j * 0.06,
                      duration: 0.4,
                    }}
                    className="flex items-baseline justify-between gap-4 text-xs"
                  >
                    <span
                      className={`flex-shrink-0 ${
                        row.mono
                          ? "font-mono text-[#9945FF]"
                          : "text-zinc-400 dark:text-zinc-600"
                      }`}
                    >
                      {row.k}
                    </span>
                    <span
                      className={`font-mono text-right ${
                        row.accent
                          ? "text-[#9945FF]"
                          : row.muted
                            ? "text-zinc-400 dark:text-zinc-600"
                            : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {row.v}
                      {/* Blinking cursor on last SSH line */}
                      {i === 2 && j === 2 && (
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="ml-0.5 text-[#9945FF]"
                        >
                          ▋
                        </motion.span>
                      )}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom connector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12 flex items-center justify-center gap-3"
        >
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-600">
                {s.num}
              </span>
              {i < STEPS.length - 1 && (
                <div className="w-12 h-px bg-gradient-to-r from-zinc-300 to-zinc-200 dark:from-white/20 dark:to-white/5" />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
