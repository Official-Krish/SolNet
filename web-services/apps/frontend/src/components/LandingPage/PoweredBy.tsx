import { motion } from "framer-motion";
import { Layers, Shield, Globe, Zap, ExternalLink } from "lucide-react";

const metrics = [
  { label: "Transaction Speed", value: "< 1s" },
  { label: "Network Fee", value: "$0.001" },
  { label: "Throughput", value: "65K TPS" },
  { label: "Uptime", value: "99.9%" },
];

const features = [
  {
    icon: Layers,
    title: "DePIN Infrastructure",
    desc: "Decentralized Physical Infrastructure Network — real hardware, real earnings.",
  },
  {
    icon: Shield,
    title: "Smart Contract Escrow",
    desc: "Trustless execution with automatic settlement. No middlemen, no disputes.",
  },
  {
    icon: Globe,
    title: "Global Network",
    desc: "Distributed compute across 127 countries. Sub-100ms latency worldwide.",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    desc: "Real-time SOL payments streamed per second of compute consumed.",
  },
];

export const PoweredBy = () => {
  return (
    <section className="relative bg-[#050508] py-28 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      {/* background glow */}
      <div className="absolute top-1/2 right-0 translate-y-[-50%] w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-xs font-bold tracking-widest text-cyan-400 uppercase mb-3">
            Technology
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Powered by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Solana
            </span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left — metrics card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl border border-white/8 bg-gradient-to-br from-white/4 to-transparent p-8 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Solana logo + name */}
            <div className="flex items-center gap-3 mb-8">
              <img
                src="/solana.png"
                className="w-10 h-10 rounded-full"
                alt="Solana"
              />
              <div>
                <p className="text-white font-bold">Solana Network</p>
                <p className="text-white/40 text-xs">
                  The most performant L1 blockchain
                </p>
              </div>
              <a
                href="https://solana.com"
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-white/20 hover:text-white/50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                  className="rounded-2xl border border-white/6 bg-white/3 px-5 py-4"
                >
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    {m.value}
                  </p>
                  <p className="text-white/40 text-xs mt-1">{m.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — feature list */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col gap-3"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                className="group flex items-start gap-4 rounded-2xl border border-white/6 bg-white/2 hover:bg-white/5 hover:border-cyan-500/20 p-5 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 transition-colors duration-300">
                  <f.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">
                    {f.title}
                  </h4>
                  <p className="text-white/40 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
