import { motion } from "framer-motion";
import { ServerCog, DownloadCloud, Wallet, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  {
    number: "01",
    icon: ServerCog,
    title: "Register Your Machine",
    description:
      "Sign in with your Solana wallet and register your hardware specs — CPU, RAM, storage, and region.",
    color: "violet",
    iconColor: "text-violet-400",
    borderColor: "border-violet-500/30",
    bgColor: "bg-violet-500/10",
    numColor: "text-violet-500/30",
  },
  {
    number: "02",
    icon: DownloadCloud,
    title: "Install SolNet CLI",
    description:
      "Run a single install script to set up the node daemon. Supports Linux, macOS, and Docker out of the box.",
    color: "cyan",
    iconColor: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-500/10",
    numColor: "text-cyan-500/30",
  },
  {
    number: "03",
    icon: Wallet,
    title: "Verify & Activate",
    description:
      "Complete on-chain wallet verification. Your node gets listed in the DePIN pool and starts accepting requests.",
    color: "fuchsia",
    iconColor: "text-fuchsia-400",
    borderColor: "border-fuchsia-500/30",
    bgColor: "bg-fuchsia-500/10",
    numColor: "text-fuchsia-500/30",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Start Earning SOL",
    description:
      "Earn SOL per second of compute time consumed. Track uptime, revenue, and requests in real-time.",
    color: "emerald",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/10",
    numColor: "text-emerald-500/30",
  },
];

export default function Steps() {
  const navigate = useNavigate();

  return (
    <section className="relative bg-[#050508] py-28 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      {/* background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-fuchsia-600/8 blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-bold tracking-widest text-fuchsia-400 uppercase mb-3">
            DePIN Hosting
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Become a Node Operator
          </h2>
          <p className="mt-4 text-white/45 max-w-xl mx-auto text-base">
            Join the decentralized compute network and turn your idle hardware
            into passive income.
          </p>
        </motion.div>

        {/* steps grid */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* connector line (desktop only) */}
          <div className="hidden lg:block absolute top-[52px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-violet-500/20 via-fuchsia-500/30 to-emerald-500/20 pointer-events-none" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group relative rounded-2xl border ${step.borderColor} bg-white/3 hover:bg-white/5 p-6 flex flex-col gap-5 transition-all duration-300 hover:border-opacity-60`}
            >
              {/* step number + icon row */}
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-xl ${step.bgColor} flex items-center justify-center`}
                >
                  <step.icon className={`w-6 h-6 ${step.iconColor}`} />
                </div>
                <span
                  className={`text-5xl font-black ${step.numColor} select-none`}
                >
                  {step.number}
                </span>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">
                  {step.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex justify-center mt-12"
        >
          <button
            onClick={() => navigate("/hosting")}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 transition-all duration-300 shadow-lg shadow-fuchsia-600/20 cursor-pointer"
          >
            Start Hosting →
          </button>
        </motion.div>
      </div>
    </section>
  );
}
