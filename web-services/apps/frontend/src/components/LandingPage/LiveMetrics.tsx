import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { useCountUp } from "./hooks/useAnimations";

interface MetricProps {
  value: number;
  suffix: string;
  label: string;
  sublabel: string;
  delay?: number;
}

function Metric({ value, suffix, label, sublabel, delay = 0 }: MetricProps) {
  const { ref, containerRef } = useCountUp(value, 2.5);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div ref={containerRef as React.RefObject<HTMLDivElement>}>
        <div className="flex items-end gap-1 mb-2">
          <span
            ref={ref}
            className="text-5xl md:text-6xl font-light text-zinc-950 dark:text-white tabular-nums"
          >
            0
          </span>
          <span className="text-2xl md:text-3xl text-[#9945FF] font-light mb-1">
            {suffix}
          </span>
        </div>
      </div>
      <p className="text-zinc-900 dark:text-white text-sm font-medium mb-1">
        {label}
      </p>
      <p className="text-zinc-500 text-xs">{sublabel}</p>
    </motion.div>
  );
}

export default function LiveMetrics() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  const metrics = [
    {
      value: 2847,
      suffix: "+",
      label: "Active Compute Nodes",
      sublabel: "Distributed globally",
    },
    {
      value: 4,
      suffix: "M+",
      label: "VM Hours Served",
      sublabel: "Since mainnet launch",
    },
    {
      value: 18200,
      suffix: "+",
      label: "SOL Processed",
      sublabel: "Through smart contract escrow",
    },
    {
      value: 12,
      suffix: "",
      label: "Regions Available",
      sublabel: "AWS · GCP · DePIN",
    },
  ];

  return (
    <section className="border-t border-black/[0.06] dark:border-white/[0.06] bg-transparent py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <span className="text-xs tracking-widest text-[#9945FF] uppercase mb-4 block">
            Network Stats
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-zinc-950 dark:text-white max-w-lg leading-tight">
            Infrastructure that{" "}
            <span className="text-zinc-400 dark:text-zinc-600">
              scales with demand.
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
          {metrics.map((m, i) => (
            <Metric key={m.label} {...m} delay={i * 0.1} />
          ))}
        </div>

        {/* Activity bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-20 border-t border-black/[0.06] dark:border-white/[0.08] pt-8"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-600 mb-3">
            <span className="font-mono">Network activity</span>
            <span className="text-amber-500 dark:text-amber-400 font-mono">
              DEVNET
            </span>
          </div>
          <div className="flex items-end gap-0.5 h-8">
            {Array.from({ length: 60 }).map((_, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-full bg-[#9945FF]"
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
