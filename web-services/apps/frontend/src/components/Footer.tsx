import { useState } from "react";
import {
  IconBrandX,
  IconBrandDiscord,
  IconBrandGithub,
  IconCircleCheck,
} from "@tabler/icons-react";
import { AxionLogo } from "./AxionLogo";

interface SiteFooterProps {
  systemStatus?: "operational" | "degraded" | "outage";
  onSubscribe?: (email: string) => Promise<void>;
}

const linkGroups = [
  {
    label: "Product",
    links: [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Rent vm", href: "/rent" },
      { name: "Depin hosting", href: "/hosting" },
    ],
  },
  {
    label: "Resources",
    links: [
      { name: "Documentation", href: "/docs" },
      { name: "Api reference", href: "/api" },
      { name: "Tutorials", href: "/tutorials" },
      { name: "Status", href: "/status" },
    ],
  },
  {
    label: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
    ],
  },
  {
    label: "Legal",
    links: [
      { name: "Privacy policy", href: "/privacy" },
      { name: "Terms of service", href: "/terms" },
      { name: "Cookie policy", href: "/cookies" },
      { name: "Gdpr", href: "/gdpr" },
    ],
  },
];

export function SiteFooter({
  systemStatus = "operational",
  onSubscribe,
}: SiteFooterProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async () => {
    if (!email || subscribing) return;
    setSubscribing(true);
    try {
      if (onSubscribe) {
        await onSubscribe(email);
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
      setSubscribed(true);
    } finally {
      setSubscribing(false);
    }
  };

  const statusColors = {
    operational: { dot: "#14F195", text: "All systems operational" },
    degraded: { dot: "#FBB924", text: "Partial system degradation" },
    outage: { dot: "#F87171", text: "Service disruption detected" },
  };

  const status = statusColors[systemStatus];

  return (
    <footer className="bg-[#0A0A10]">
      <div className="border-t" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-10 gap-y-12">
          <div className="lg:col-span-4 lg:pr-10">
            <div className="flex items-center gap-2 mb-3">
              <AxionLogo size={32} />
              <span className="text-white text-xl font-medium tracking-tight">
                Axion
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-[rgba(255,255,255,0.4)] mb-6 max-w-xs">
              Decentralized compute on Solana.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="https://x.com/KrishAnand0103"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] flex items-center justify-center hover:border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.1)] transition-all duration-120"
              >
                <IconBrandX className="w-3.5 h-3.5 text-[rgba(255,255,255,0.5)]" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] flex items-center justify-center hover:border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.1)] transition-all duration-120"
              >
                <IconBrandDiscord className="w-3.5 h-3.5 text-[rgba(255,255,255,0.5)]" />
              </a>
              <a
                href="https://github.com/Official-Krish"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] flex items-center justify-center hover:border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.1)] transition-all duration-120"
              >
                <IconBrandGithub className="w-3.5 h-3.5 text-[rgba(255,255,255,0.5)]" />
              </a>
            </div>
          </div>

          {linkGroups.map((group) => (
            <div key={group.label} className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-[2px] h-3 rounded-full bg-[#14F195]" />
                <span className="text-[13px] font-medium text-white">
                  {group.label}
                </span>
              </div>
              <ul className="space-y-[28px]">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      rel="noopener noreferrer"
                      className="text-[13px] font-normal text-[rgba(255,255,255,0.45)] hover:text-white transition-colors duration-120"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <p className="text-[15px] font-medium text-white">
                Stay in the loop
              </p>
              <p className="text-[13px] text-[rgba(255,255,255,0.4)] mt-0.5">
                Network updates, new regions, and compute pricing changes.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              {subscribed ? (
                <div className="flex items-center gap-2 text-[13px] text-[#14F195]">
                  <IconCircleCheck className="w-4 h-4" />
                  <span>You're in. We'll keep it signal, no spam.</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubscribe();
                    }}
                    placeholder="your@email.com"
                    className="h-10 w-64 bg-[#0A0A10] border border-[rgba(255,255,255,0.1)] rounded-[10px] px-3 text-[13px] text-white placeholder:text-[rgba(255,255,255,0.25)] font-mono outline-none focus:border-[#14F195] transition-colors duration-120"
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing || !email}
                    className="h-10 w-[120px] bg-[#14F195] text-[#070B0A] rounded-[10px] text-[13px] font-semibold hover:opacity-85 transition-opacity duration-120 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {subscribing ? "Sending..." : "Subscribe"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 py-5 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[12px] text-[rgba(255,255,255,0.25)]">
            <span>© 2026 Axion</span>
            <span className="text-[rgba(255,255,255,0.12)]">·</span>
            <span>All rights reserved</span>
            <span className="text-[rgba(255,255,255,0.12)]">·</span>
            <span>Built on</span>
            <svg
              width="48"
              height="12"
              viewBox="0 0 397 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-30"
            >
              <path
                d="M64.6 11.2c-1.1-1.1-2.6-1.7-4.2-1.7H10.8c-2.7 0-4 3.2-2.1 5.1l49.6 49.6c1.1 1.1 2.6 1.7 4.2 1.7h49.6c2.7 0 4-3.2 2.1-5.1L64.6 11.2zM10.8 41.8c-1.6 0-3.1.6-4.2 1.7L1.7 48.4c-1.1 1.1-1.7 2.6-1.7 4.2v49.6c0 2.7 3.2 4 5.1 2.1l49.6-49.6c1.1-1.1 1.7-2.6 1.7-4.2V11.2c0-2.7-3.2-4-5.1-2.1L15 40.1c-1.1 1.1-2.6 1.7-4.2 1.7z"
                fill="currentColor"
              />
            </svg>
          </div>
          <a
            href="/status"
            className="flex items-center gap-2 text-[12px] text-[rgba(255,255,255,0.4)] hover:text-white transition-colors duration-120"
          >
            <span className="relative w-2 h-2">
              <span
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: status.dot }}
              />
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ backgroundColor: status.dot, opacity: 0.6 }}
              />
            </span>
            {status.text}
          </a>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
