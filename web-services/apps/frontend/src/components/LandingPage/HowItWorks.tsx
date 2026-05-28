import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";

interface DetailRow {
  k: string;
  v: string;
  accent?: boolean;
  mono?: boolean;
  muted?: boolean;
  pill?: boolean;
}

const STEPS: {
  num: string;
  tag: string;
  title: string;
  body: string;
  detail: DetailRow[];
  isTerminal?: boolean;
}[] = [
  {
    num: "01",
    tag: "01 — DEPLOY  /  Instant Provisioning",
    title: "Deploy in Seconds. Not Minutes.",
    body: "Pick a region, choose your specs, connect your wallet. Your VM is live in under 30 seconds — no signups, no credit cards, no waiting.",
    detail: [
      { k: "vCPU", v: "4 cores" },
      { k: "RAM", v: "16 GB" },
      { k: "Storage", v: "100 GB SSD" },
      { k: "Region", v: "us-east-1" },
      { k: "Cost", v: "0.42 SOL / 24h", accent: true, pill: true },
    ],
  },
  {
    num: "02",
    tag: "02 — PAY  /  Trustless Billing",
    title: "Pay with SOL",
    body: "No invoices. No chargebacks. SOL flows from your wallet into escrow, then to the provider — one second at a time. Fully onchain, fully auditable.",
    detail: [
      { k: "Wallet", v: "Connected" },
      { k: "Escrow", v: "0.42 SOL locked", pill: true },
      { k: "Billing", v: "Per-second" },
      { k: "Status", v: "Active", accent: true, pill: true },
    ],
  },
  {
    num: "03",
    tag: "03 — EARN  /  Passive SOL Income",
    title: "SSH in",
    body: "VM boots in under 30 seconds. Connect via SSH or the browser terminal and ship.",
    isTerminal: true,
    detail: [
      { k: "$", v: "ssh root@vm-7f2a.Axion.io", mono: true },
      { k: "→", v: "Connecting...", mono: true, muted: true },
      { k: "✓", v: "Ready", mono: true, accent: true },
    ],
  },
];

function TerminalDetail({
  detail,
  inView,
  stepIdx,
}: {
  detail: DetailRow[];
  inView: boolean;
  stepIdx: number;
}) {
  return (
    <div className="mt-auto pt-4 border-t border-white/[0.06]">
      {/* Terminal header */}
      <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-white/[0.06]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        <span className="ml-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-500">
          bash — root@Axion
        </span>
      </div>
      <div className="space-y-2">
        {detail.map((row, j) => (
          <motion.div
            key={j}
            initial={{ opacity: 0, x: -6 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{
              delay: 0.4 + stepIdx * 0.12 + j * 0.06,
              duration: 0.4,
            }}
            className="flex items-baseline justify-between gap-4 text-xs"
          >
            <span className="font-mono text-[#9945FF] flex-shrink-0">
              {row.k}
            </span>
            <span
              className={`font-mono text-right ${row.accent ? "text-emerald-400" : row.muted ? "text-zinc-500" : "text-zinc-300"}`}
            >
              {row.v}
              {j === detail.length - 1 && (
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
    </div>
  );
}

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeStep, setActiveStep] = useState<number | null>(null);

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
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-0.5 h-4 bg-[#9945FF] rounded-full" />
            <span className="text-xs tracking-[0.14em] text-[#9945FF] uppercase">
              How it works
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-light text-zinc-950 dark:text-white leading-tight tracking-tight">
            Zero to production.
            <br />
            {/* Opacity raised from ~30% to ~60% */}
            <span className="text-zinc-400 dark:text-zinc-500">
              Three steps.
            </span>
          </h2>
        </motion.div>

        {/* Steps — no equal-height forcing, natural flex */}
        <div className="grid md:grid-cols-3 gap-6">
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
              onMouseEnter={() => setActiveStep(i)}
              onMouseLeave={() => setActiveStep(null)}
              className={`relative rounded-2xl overflow-hidden flex flex-col gap-5 p-7 transition-all duration-300
                border border-white/[0.22] dark:border-white/[0.22]
                bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm
                ${activeStep === i ? "shadow-[0_0_0_1px_rgba(153,69,255,0.3),0_8px_32px_-8px_rgba(153,69,255,0.25)]" : ""}
              `}
            >
              {/* Top accent bar — gradient line */}
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#9945FF] via-[#9945FF]/60 to-transparent" />

              {/* Watermark step number */}
              <div
                aria-hidden
                className="absolute top-3 right-4 font-mono font-bold text-[#9945FF] select-none pointer-events-none"
                style={{ fontSize: 56, opacity: 0.07, lineHeight: 1 }}
              >
                {step.num}
              </div>

              {/* Small readable step tag */}
              <span className="text-[10px] font-mono text-[#9945FF] tracking-[0.14em] uppercase relative z-10">
                {step.tag}
              </span>

              {/* Title + body */}
              <div className="relative z-10">
                <h3 className="text-lg font-medium text-zinc-950 dark:text-white mb-2 tracking-tight leading-snug">
                  {step.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed">
                  {step.body}
                </p>
              </div>

              {/* Detail block */}
              {step.isTerminal ? (
                <TerminalDetail
                  detail={step.detail}
                  inView={inView}
                  stepIdx={i}
                />
              ) : (
                <div className="mt-auto pt-4 border-t border-black/[0.06] dark:border-white/[0.06] space-y-1.5 relative z-10">
                  {step.detail.map((row, j) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, x: -6 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{
                        delay: 0.4 + i * 0.12 + j * 0.06,
                        duration: 0.4,
                      }}
                      className={`flex items-center justify-between gap-4 text-xs px-2 py-1 rounded-md ${j % 2 === 0 ? "bg-black/[0.02] dark:bg-white/[0.02]" : ""}`}
                    >
                      <span className="flex-shrink-0 text-zinc-400 dark:text-zinc-600">
                        {row.k}
                      </span>
                      {row.pill ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${row.accent ? "bg-[#9945FF]/15 text-[#9945FF]" : "bg-emerald-500/15 text-emerald-500"}`}
                        >
                          {row.v}
                        </span>
                      ) : (
                        <span className="font-mono text-right text-zinc-700 dark:text-zinc-300">
                          {row.v}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Chevron connectors between cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 hidden md:flex items-center justify-center gap-0"
        >
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <button
                onClick={() => setActiveStep(i)}
                className={`text-[11px] font-mono px-3 py-1 rounded-full transition-all duration-200 ${activeStep === i ? "text-[#9945FF] bg-[#9945FF]/10" : "text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400"}`}
              >
                {s.num}
              </button>
              {i < STEPS.length - 1 && (
                <span className="text-zinc-300 dark:text-zinc-700 mx-2 text-sm">
                  ›
                </span>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
