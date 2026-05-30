import { motion } from "motion/react";
import { Zap, Shield, Globe, Code2, Server, Coins } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Deploy in < 30 Seconds",
    description:
      "From wallet connect to a running VM in under half a minute. No lengthy provisioning queues.",
    accent: "from-yellow-500/20 to-orange-500/10",
    border: "hover:border-yellow-500/30",
    iconColor: "text-yellow-400",
    span: "col-span-1 row-span-1",
  },
  {
    icon: Shield,
    title: "Smart Contract Escrow",
    description:
      "Payments are locked in Solana smart contracts. Funds release only on successful session completion — trustless by design.",
    accent: "from-violet-500/20 to-purple-500/10",
    border: "hover:border-violet-500/30",
    iconColor: "text-violet-400",
    span: "col-span-2 row-span-1",
    wide: true,
  },
  {
    icon: Globe,
    title: "12+ Global Regions",
    description:
      "Deploy close to your users. AWS, GCP, or DePIN nodes — all available through a single interface.",
    accent: "from-cyan-500/20 to-blue-500/10",
    border: "hover:border-cyan-500/30",
    iconColor: "text-cyan-400",
    span: "col-span-1 row-span-1",
  },
  {
    icon: Coins,
    title: "Zero Credit Cards",
    description:
      "Pay with SOL. No KYC, no billing details, no bank approvals. Your wallet is your identity.",
    accent: "from-emerald-500/20 to-teal-500/10",
    border: "hover:border-emerald-500/30",
    iconColor: "text-emerald-400",
    span: "col-span-1 row-span-1",
  },
  {
    icon: Server,
    title: "DePIN Node Earnings",
    description:
      "Run a node on your idle hardware. Earn SOL every second your resources are in use.",
    accent: "from-fuchsia-500/20 to-pink-500/10",
    border: "hover:border-fuchsia-500/30",
    iconColor: "text-fuchsia-400",
    span: "col-span-2 row-span-1",
    wide: true,
  },
  {
    icon: Code2,
    title: "SSH & CI/CD Ready",
    description:
      "Direct SSH terminal access, API keys, and webhooks. Integrates with your existing pipeline in minutes.",
    accent: "from-blue-500/20 to-indigo-500/10",
    border: "hover:border-blue-500/30",
    iconColor: "text-blue-400",
    span: "col-span-1 row-span-1",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function FeaturesSection() {
  return (
    <section className="relative bg-[#050508] py-28 overflow-hidden">
      {/* top separator */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      {/* background blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className="text-xs font-bold tracking-widest text-violet-400 uppercase mb-3">
            Platform Features
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Everything you need.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
              Nothing you don't.
            </span>
          </h2>
        </motion.div>

        {/* bento grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-3 gap-4 auto-rows-[200px]"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariants}
              className={`group relative rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 ${f.span} ${f.border} hover:bg-white/5`}
            >
              {/* gradient accent */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />

              <div className="relative z-10 flex flex-col gap-4 h-full">
                {/* icon */}
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>

                <div>
                  <h3 className="font-bold text-white text-base mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed line-clamp-3">
                    {f.description}
                  </p>
                </div>
              </div>

              {/* corner shimmer */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/3 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
