import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";

interface Tx {
  id: number;
  from: string;
  to: string;
  amount: string;
  sig: string;
  ms: number;
  confirmed: boolean;
}

let counter = 0;
const AMOUNTS = ["0.42", "0.18", "1.02", "0.07", "0.65", "0.33"];
const ROUTES = [
  { from: "Wallet", to: "Escrow" },
  { from: "Escrow", to: "Provider" },
  { from: "Escrow", to: "Wallet" },
];

const STATS = [
  { label: "Avg finality", value: "400ms" },
  { label: "Tx fee", value: "~$0.0001" },
  { label: "Network TPS", value: "65,000" },
];

export default function SOLPaymentFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [feed, setFeed] = useState<Tx[]>([]);
  const [pipe, setPipe] = useState(0); // 0=wallet→escrow, 1=escrow→provider

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      const route = ROUTES[Math.floor(Math.random() * ROUTES.length)];
      const amount = AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];
      const tx: Tx = {
        id: counter++,
        from: route.from,
        to: route.to,
        amount: `${amount} SOL`,
        sig: Math.random().toString(36).slice(2, 10).toUpperCase(),
        ms: 300 + Math.floor(Math.random() * 300),
        confirmed: false,
      };
      setFeed((p) => [tx, ...p].slice(0, 5));
      setPipe((p) => (p + 1) % 2);
      setTimeout(() => {
        setFeed((p) =>
          p.map((t) => (t.id === tx.id ? { ...t, confirmed: true } : t)),
        );
      }, tx.ms);
    }, 1800);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <section
      ref={ref}
      className="relative border-t border-black/[0.06] dark:border-white/[0.06] bg-transparent py-28 px-6 overflow-hidden"
    >
      {/* Accent wash */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(153,69,255,0.07), transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <span className="text-xs tracking-widest text-[#9945FF] uppercase mb-4 block">
            Payment Layer
          </span>
          <h2 className="text-4xl md:text-6xl font-light text-zinc-950 dark:text-white leading-[1.05] tracking-tight">
            Pay per second.
            <br />
            <span className="text-zinc-400 dark:text-zinc-600">
              Settled on-chain.
            </span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* LEFT — flow diagram */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Three nodes + animated pipe */}
            <div className="relative">
              {/* Nodes */}
              {[
                {
                  label: "Your Wallet",
                  sub: "Phantom / any Solana wallet",
                  color: "#9945FF",
                  icon: "◎",
                },
                {
                  label: "Smart Contract",
                  sub: "Escrow — holds funds trustlessly",
                  color: "#6366F1",
                  icon: "⬡",
                },
                {
                  label: "VM Provider",
                  sub: "AWS · GCP · DePIN host",
                  color: "#38BDF8",
                  icon: "▣",
                },
              ].map((node, i) => (
                <div key={node.label} className="relative">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    className="flex items-center gap-5 py-5"
                  >
                    {/* Icon + connector column */}
                    <div className="flex flex-col items-center flex-shrink-0 w-10">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-base font-mono"
                        style={{
                          backgroundColor: node.color + "18",
                          color: node.color,
                          boxShadow: `0 0 0 1px ${node.color}30`,
                        }}
                      >
                        {node.icon}
                      </div>
                      {/* Animated connector line */}
                      {i < 2 && (
                        <div
                          className="relative flex-1 w-px mt-1"
                          style={{ height: 40 }}
                        >
                          <div className="absolute inset-0 bg-zinc-200 dark:bg-white/10" />
                          {/* Moving dot */}
                          <motion.div
                            className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: node.color, top: 0 }}
                            animate={inView ? { top: [0, 34, 0] } : {}}
                            transition={{
                              duration: 1.6,
                              delay: pipe === i ? 0 : 1,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div>
                      <div className="text-zinc-950 dark:text-white text-sm font-medium leading-none mb-1">
                        {node.label}
                      </div>
                      <div className="text-zinc-500 dark:text-zinc-500 text-xs">
                        {node.sub}
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div className="mt-8 grid grid-cols-3 gap-4 pt-8 border-t border-black/[0.06] dark:border-white/[0.06]">
              {STATS.map(({ label, value }) => (
                <div key={label}>
                  <div className="text-zinc-950 dark:text-white text-lg font-light font-mono tabular-nums">
                    {value}
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-500 text-xs mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — live tx feed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-500 font-mono uppercase tracking-widest">
                Live transactions
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Solana devnet
              </span>
            </div>

            {/* Feed container — fixed height, no layout jank */}
            <div className="relative rounded-2xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06] text-[10px] font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                <span>Route</span>
                <span>Amount</span>
                <span>Finality</span>
                <span>Status</span>
              </div>

              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04] min-h-[280px]">
                <AnimatePresence initial={false}>
                  {feed.map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-center px-4 py-3 font-mono text-xs"
                    >
                      <span className="text-zinc-700 dark:text-zinc-400 truncate">
                        {tx.from}
                        <span className="text-[#9945FF] mx-1">→</span>
                        {tx.to}
                      </span>
                      <span className="text-zinc-900 dark:text-white font-medium">
                        {tx.amount}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-500">
                        {tx.ms}ms
                      </span>
                      <motion.span
                        animate={
                          tx.confirmed
                            ? { color: "#10B981" }
                            : { color: "#9945FF" }
                        }
                        className="text-[10px] font-medium"
                      >
                        {tx.confirmed ? "✓" : "···"}
                      </motion.span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {feed.length === 0 && (
                  <div className="flex items-center justify-center h-[280px] text-zinc-400 dark:text-zinc-600 text-[11px] font-mono">
                    Waiting for transactions…
                  </div>
                )}
              </div>
            </div>

            {/* Footnote */}
            <p className="mt-4 text-[11px] text-zinc-500 dark:text-zinc-600 leading-relaxed">
              Funds are locked in a smart contract escrow. Released per-second
              as compute is consumed — no manual settlement needed.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
