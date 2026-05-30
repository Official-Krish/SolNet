import { useState } from "react";
import {
  IconCircleCheck,
  IconRocket,
  IconCopy,
  IconCheck,
  IconArrowRight,
  IconCoins,
  IconShieldCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { startScript } from "./constants/scripts";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[14px] p-6"
      style={{
        background: "#0F0F1C",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {children}
    </div>
  );
}

function CodeBlock({ script }: { script: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        background: "#080810",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: "rgba(255,255,255,0.02)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-[10px] font-mono text-white/30">
            bash — root@Axion
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] font-mono transition-colors"
          style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.7)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.35)")
          }
        >
          {copied ? (
            <IconCheck size={13} color="#22C55E" />
          ) : (
            <IconCopy size={13} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 font-mono text-sm text-zinc-300 overflow-x-auto leading-relaxed">
        <code>{script}</code>
      </pre>
    </div>
  );
}

export const Step3 = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Success banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card>
          <div className="flex flex-col items-center text-center py-4">
            {/* Animated check */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.15,
                type: "spring",
                stiffness: 260,
                damping: 18,
              }}
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.25)",
                boxShadow: "0 0 24px rgba(34,197,94,0.15)",
              }}
            >
              <IconCircleCheck size={28} color="#22C55E" />
            </motion.div>

            <h3 className="text-lg font-semibold text-white mb-1">
              Verification Successful
            </h3>
            <p className="text-sm text-white/40 max-w-sm leading-relaxed">
              Your machine is verified and ready. Run the activation script
              below to install the Axion agent and start earning SOL.
            </p>

            {/* Quick stats row */}
            <div className="flex items-center gap-6 mt-5 pt-5 border-t border-white/[0.06] w-full justify-center">
              {[
                { icon: IconShieldCheck, label: "Verified", color: "#22C55E" },
                { icon: IconCoins, label: "Earning soon", color: "#6366F1" },
                {
                  icon: IconRocket,
                  label: "Ready to activate",
                  color: "#38BDF8",
                },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon size={14} color={color} />
                  <span className="text-[11px] font-medium" style={{ color }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Activation script */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(56,189,248,0.12)" }}
            >
              <IconRocket size={18} color="#38BDF8" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Activate Your Node
              </p>
              <p className="text-xs text-white/40">
                Install the Axion agent and go live
              </p>
            </div>
          </div>

          <p
            className="text-xs leading-relaxed mb-4"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Run this script on your machine to install the Axion node daemon.
            Once complete, your node will appear in the DePIN pool and SOL will
            start accumulating.
          </p>

          <CodeBlock script={startScript} />
        </Card>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
      >
        <button
          onClick={() => navigate("/depin/host/dashboard")}
          className="w-full h-12 rounded-[12px] flex items-center justify-center gap-2 text-[15px] font-medium text-white"
          style={{ background: "linear-gradient(135deg, #6366F1, #38BDF8)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.88";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Go to dashboard <IconArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
};
