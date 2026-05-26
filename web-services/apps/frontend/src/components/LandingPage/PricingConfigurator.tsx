import { useState, useRef } from "react";
import { motion, useInView } from "motion/react";
import { Slider } from "@/components/ui/slider";

const SOL_PRICE = 150;

function formatSOL(usd: number) {
  return (usd / SOL_PRICE).toFixed(4);
}

const PROVIDERS = ["AWS", "GCP", "DePIN"] as const;
type Provider = (typeof PROVIDERS)[number];

const PRICE_MULTIPLIERS: Record<Provider, number> = {
  AWS: 1.0,
  GCP: 0.95,
  DePIN: 0.45,
};

const BASE_PRICE = {
  cpu: 0.048,
  ram: 0.006,
  storage: 0.0001,
};

export default function PricingConfigurator() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [cpu, setCpu] = useState(4);
  const [ram, setRam] = useState(8);
  const [storage, setStorage] = useState(50);
  const [hours, setHours] = useState(24);
  const [provider, setProvider] = useState<Provider>("AWS");

  const hourlyUSD =
    (BASE_PRICE.cpu * cpu +
      BASE_PRICE.ram * ram +
      BASE_PRICE.storage * storage) *
    PRICE_MULTIPLIERS[provider];
  const totalUSD = hourlyUSD * hours;
  const totalSOL = parseFloat(formatSOL(totalUSD));
  const hourlySOL = parseFloat(formatSOL(hourlyUSD));

  const sliders = [
    {
      label: "vCPU Cores",
      value: cpu,
      set: setCpu,
      min: 1,
      max: 32,
      step: 1,
      unit: "cores",
    },
    {
      label: "Memory",
      value: ram,
      set: setRam,
      min: 1,
      max: 128,
      step: 1,
      unit: "GB",
    },
    {
      label: "Storage",
      value: storage,
      set: setStorage,
      min: 10,
      max: 2000,
      step: 10,
      unit: "GB SSD",
    },
    {
      label: "Duration",
      value: hours,
      set: setHours,
      min: 1,
      max: 720,
      step: 1,
      unit: "hours",
    },
  ];

  return (
    <section
      ref={ref}
      className="relative border-t border-black/[0.06] dark:border-white/[0.06] bg-transparent py-32 px-6"
    >
      {/* Section accent wash */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 80% 50%, rgba(56,189,248,0.10), transparent 70%)",
        }}
      />
      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="text-xs tracking-widest text-[#9945FF] uppercase mb-4 block">
            Pricing
          </span>
          <h2 className="text-4xl md:text-6xl font-light text-zinc-950 dark:text-white leading-tight">
            Configure your
            <br />
            <span className="text-zinc-400 dark:text-zinc-600">
              infrastructure.
            </span>
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-4 max-w-md">
            Drag the sliders. See real-time cost in SOL. No surprises.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="space-y-8"
          >
            {/* Provider selector */}
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-widest mb-3">
                Provider
              </div>
              <div className="flex gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                      provider === p
                        ? "bg-[#9945FF]/10 border-[#9945FF]/40 text-[#9945FF]"
                        : "bg-white dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {p}
                    {p === "DePIN" && (
                      <span className="ml-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                        -55%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {sliders.map(({ label, value, set, min, max, step, unit }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-700 dark:text-zinc-300 text-sm">
                    {label}
                  </span>
                  <span className="text-zinc-950 dark:text-white font-mono text-sm">
                    {value}{" "}
                    <span className="text-zinc-400 dark:text-zinc-600">
                      {unit}
                    </span>
                  </span>
                </div>
                <Slider
                  min={min}
                  max={max}
                  step={step}
                  value={[value]}
                  onValueChange={([v]) => set(v)}
                  className="[&_[role=slider]]:bg-[#9945FF] [&_[role=slider]]:border-[#9945FF] [&_.range]:bg-[#9945FF]"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-600 mt-1.5 font-mono">
                  <span>{min}</span>
                  <span>{max}</span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Cost display */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="sticky top-24"
          >
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-[#9945FF]/30 via-pink-300/20 to-cyan-300/20 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(153,69,255,0.25)]">
              <div className="bg-white dark:bg-white/[0.03] rounded-[15px] p-8">
                <div className="text-zinc-500 text-xs uppercase tracking-widest mb-6">
                  Cost Estimate
                </div>

                <motion.div
                  key={totalSOL}
                  initial={{ opacity: 0.5, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-6xl font-light text-zinc-950 dark:text-white tabular-nums">
                      {totalSOL.toFixed(3)}
                    </span>
                    <span className="text-2xl text-[#9945FF] mb-1">SOL</span>
                  </div>
                  <div className="text-zinc-500 text-sm">
                    ${totalUSD.toFixed(2)} USD · {hours}h total
                  </div>
                </motion.div>

                <div className="h-px bg-black/[0.06] my-6" />

                <div className="space-y-3 mb-6">
                  {[
                    {
                      label: `${cpu} vCPU`,
                      usd:
                        BASE_PRICE.cpu *
                        cpu *
                        hours *
                        PRICE_MULTIPLIERS[provider],
                    },
                    {
                      label: `${ram}GB RAM`,
                      usd:
                        BASE_PRICE.ram *
                        ram *
                        hours *
                        PRICE_MULTIPLIERS[provider],
                    },
                    {
                      label: `${storage}GB SSD`,
                      usd:
                        BASE_PRICE.storage *
                        storage *
                        hours *
                        PRICE_MULTIPLIERS[provider],
                    },
                  ].map(({ label, usd }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-zinc-500">{label}</span>
                      <div className="text-right">
                        <span className="text-zinc-700 dark:text-zinc-300 font-mono">
                          {formatSOL(usd)} SOL
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-black/[0.06] mb-6" />

                <div className="flex justify-between text-xs text-zinc-400 dark:text-zinc-600 mb-8">
                  <span>Hourly rate</span>
                  <span className="font-mono">
                    {hourlySOL.toFixed(6)} SOL/hr
                  </span>
                </div>

                <a
                  href="/rent-vm"
                  className="w-full flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white py-3.5 rounded-xl text-sm font-medium transition-colors duration-200"
                >
                  Deploy with this config
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>

                {/* Comparison bar */}
                <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3">
                    vs Traditional Cloud
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-zinc-500">SolNet</span>
                        <span className="text-[#9945FF] font-mono">
                          ${totalUSD.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#9945FF]"
                          style={{
                            width: `${Math.min(100, (totalUSD / (totalUSD / PRICE_MULTIPLIERS[provider])) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-zinc-500">AWS/GCP</span>
                        <span className="text-zinc-600 dark:text-zinc-400 font-mono">
                          ${(totalUSD / PRICE_MULTIPLIERS[provider]).toFixed(2)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-zinc-400 dark:bg-zinc-600"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                  </div>
                  {provider === "DePIN" && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                      You save{" "}
                      {((1 - PRICE_MULTIPLIERS.DePIN) * 100).toFixed(0)}% with
                      DePIN hosts
                    </p>
                  )}
                </div>

                <p className="text-center text-zinc-400 dark:text-zinc-600 text-[10px] mt-4">
                  Billed per second · Smart contract escrow · Cancel anytime
                </p>
                <p className="text-center text-amber-600 dark:text-amber-400 text-[10px] mt-1 font-medium">
                  Currently in early access · Devnet
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
