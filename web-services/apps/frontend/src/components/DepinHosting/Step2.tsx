import { useState } from "react";
import {
  IconTerminal2,
  IconCopy,
  IconCheck,
  IconArrowRight,
  IconLoader2,
  IconAlertCircle,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { verificationScript } from "./constants/scripts";

interface Step2Props {
  handleStep2Verify: () => Promise<void>;
  isLoading: boolean;
}

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
      {/* Terminal header */}
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
            bash — root@solnet
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

export const Step2 = ({ handleStep2Verify, isLoading }: Step2Props) => {
  return (
    <div className="space-y-4">
      <Card>
        {/* Section header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(99,102,241,0.12)" }}
          >
            <IconTerminal2 size={18} color="#6366F1" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              Run Verification Script
            </p>
            <p className="text-xs text-white/40">
              Prove machine ownership and specs
            </p>
          </div>
        </div>

        <p
          className="text-xs leading-relaxed mb-4"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          Copy and run this command on your machine. It verifies your hardware
          specs and availability before adding it to the network.
        </p>

        <CodeBlock script={verificationScript} />

        {/* Info row */}
        <div
          className="flex items-start gap-2.5 mt-4 p-3 rounded-[10px]"
          style={{
            background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <IconAlertCircle
            size={14}
            color="#6366F1"
            className="flex-shrink-0 mt-0.5"
          />
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            After running the script, click below. We'll check for a successful
            connection from your machine.
          </p>
        </div>
      </Card>

      {/* CTA */}
      <button
        onClick={handleStep2Verify}
        disabled={isLoading}
        className="w-full h-12 rounded-[12px] flex items-center justify-center gap-2 text-[15px] font-medium text-white transition-all duration-120"
        style={{
          background: "linear-gradient(135deg, #6366F1, #38BDF8)",
          opacity: isLoading ? 0.6 : 1,
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.opacity = "0.88";
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = isLoading ? "0.6" : "1";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {isLoading ? (
          <>
            <IconLoader2 size={18} className="animate-spin" /> Verifying…
          </>
        ) : (
          <>
            I've run the script <IconArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
};
