import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 12000, suffix: "+", label: "VMs deployed", decimals: 0 },
  { value: 99.9, suffix: "%", label: "Uptime SLA", decimals: 1 },
  { value: 127, suffix: "", label: "Countries", decimals: 0 },
  { value: 0.001, suffix: "", label: "Avg fee (SOL)", decimals: 3 },
];

function Counter({
  value,
  suffix,
  decimals,
}: {
  value: number;
  suffix: string;
  decimals: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 70;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="relative bg-[#050508] py-24 overflow-hidden">
      {/* ambient glow only - no rectangles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[200px] bg-violet-600/8 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-y-12 lg:gap-x-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative flex-1 min-w-[150px] flex flex-col gap-2"
            >
              {/* gradient vertical line divider (except first) */}
              {i > 0 && (
                <span className="hidden lg:block absolute -left-4 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-violet-500/30 to-transparent" />
              )}

              <p className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tabular-nums leading-none tracking-tight">
                <Counter
                  value={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                />
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
