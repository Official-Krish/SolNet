import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Link } from "react-router-dom";

const TUTORIALS = [
  {
    n: "01",
    time: "5 min",
    tag: "Beginner",
    title: "Deploy your first VM",
    desc: "Connect wallet, pick a spec, confirm SOL escrow. Your first machine is running in under 30 seconds.",
    href: "/rent",
  },
  {
    n: "02",
    time: "3 min",
    tag: "Beginner",
    title: "Set up SSH access",
    desc: "Retrieve your ephemeral key, connect via terminal. This guide walks you through the first session.",
    href: "/docs",
  },
  {
    n: "03",
    time: "10 min",
    tag: "Intermediate",
    title: "Register a DePIN host node",
    desc: "Install the verification script, register on-chain, activate your machine and watch rewards accumulate.",
    href: "/hosting",
  },
  {
    n: "04",
    time: "7 min",
    tag: "Intermediate",
    title: "Deploy a Docker image",
    desc: "Push a container to the DePIN network. Covers image selection, port mapping, and environment variables.",
    href: "/docker/deploy",
  },
  {
    n: "05",
    time: "2 min",
    tag: "Beginner",
    title: "Claim earned SOL rewards",
    desc: "Open the rewards panel, select machines with pending balance, and initiate a single claim transaction.",
    href: "/depin/rewards",
  },
  {
    n: "06",
    time: "4 min",
    tag: "Advanced",
    title: "Understand the escrow contract",
    desc: "Walk through the Anchor program logic: how funds are locked, metered, and released after session end.",
    href: "/docs",
  },
];

const TAG_COLOR: Record<string, string> = {
  Beginner: "text-emerald-500",
  Intermediate: "text-[#9945FF]",
  Advanced: "text-amber-500",
};

function TutRow({ t, i }: { t: (typeof TUTORIALS)[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: i * 0.08 }}
    >
      <Link
        to={t.href}
        className="grid md:grid-cols-12 gap-4 py-8 border-b border-black/[0.05] dark:border-white/[0.05] group"
      >
        <div className="md:col-span-1">
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
            {t.n}
          </span>
        </div>
        <div className="md:col-span-7">
          <h3 className="text-xl font-light text-zinc-950 dark:text-white group-hover:text-[#9945FF] transition-colors duration-300 mb-2">
            {t.title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 font-light leading-relaxed">
            {t.desc}
          </p>
        </div>
        <div className="md:col-span-4 flex md:justify-end items-start gap-4 pt-0.5">
          <span
            className={`text-[10px] tracking-[0.18em] uppercase ${TAG_COLOR[t.tag]}`}
          >
            {t.tag}
          </span>
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
            {t.time}
          </span>
          <span className="text-zinc-400 group-hover:text-[#9945FF] group-hover:translate-x-1 transition-all duration-300 text-sm">
            →
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Tutorials() {
  return (
    <div className="min-h-screen bg-[#F4F2F8] dark:bg-zinc-950 pt-28 pb-40 px-6 overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 30% at 30% 10%, rgba(153,69,255,0.06), transparent 70%)",
        }}
      />

      <div className="max-w-5xl mx-auto">
        {/* header */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-10"
          >
            <span className="h-px w-6 bg-[#9945FF]/60" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-zinc-500 dark:text-white/40">
              Tutorials
            </span>
            <span className="ml-auto text-[11px] font-mono text-zinc-400 dark:text-zinc-600">
              {TUTORIALS.length} guides
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
                Learn by doing.
              </motion.span>
            </span>
          </h1>
        </div>

        {/* tag legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-6 mb-8 text-[10px] tracking-[0.18em] uppercase"
        >
          {Object.entries(TAG_COLOR).map(([tag, cls]) => (
            <span key={tag} className={`flex items-center gap-1.5 ${cls}`}>
              <span className="w-1 h-1 rounded-full bg-current" />
              {tag}
            </span>
          ))}
        </motion.div>

        <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
          {TUTORIALS.map((t, i) => (
            <TutRow key={t.n} t={t} i={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
