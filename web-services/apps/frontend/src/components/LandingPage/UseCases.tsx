import { useEffect, useRef, useState } from "react";

const FEATURES = [
  {
    icon: "◎",
    color: "rgba(99,102,241,",
    title: "No credit cards",
    body: "Pay directly with SOL from your wallet. No KYC, no invoices, no billing cycles. Connect and compute.",
  },
  {
    icon: "⬡",
    color: "rgba(56,189,248,",
    title: "Earn from idle hardware",
    body: "Register your machine on the DePIN network. Every second of compute served pays you in SOL — streamed directly to your wallet.",
  },
  {
    icon: "▣",
    color: "rgba(34,197,94,",
    title: "Fully on-chain billing",
    body: "Every payment flows through an audited smart contract escrow. No intermediaries, no trust required. Fully auditable.",
  },
];

function FeatureRow({
  icon,
  color,
  title,
  body,
  delay,
}: (typeof FEATURES)[0] & { delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 24,
          transform: hovered ? "translateX(4px)" : "translateX(0)",
          transition: "transform 0.15s ease",
        }}
      >
        {/* Ambient icon — no container, just glow */}
        <div
          style={{
            width: 48,
            height: 48,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            color: color + "0.9)",
            background: `radial-gradient(circle at center, ${color}${hovered ? "0.35" : "0.18"}) 0%, transparent 70%)`,
            transition: "background 0.15s ease",
          }}
        >
          {icon}
        </div>

        <div style={{ maxWidth: 480 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: hovered ? "rgba(255,255,255,0.95)" : "#ffffff",
              marginBottom: 8,
              transition: "color 0.15s ease",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.7,
            }}
          >
            {body}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UseCases() {
  const headlineRef = useRef<HTMLDivElement>(null);
  const [headlineVisible, setHeadlineVisible] = useState(false);

  useEffect(() => {
    const el = headlineRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setHeadlineVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        paddingTop: 120,
        paddingBottom: 160,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      {/* Ambient background gradients — atmospheric, not structural */}
      <div
        aria-hidden
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -120,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: "40%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto" }}>
        {/* Section label */}
        <div
          ref={headlineRef}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 2,
              height: 14,
              borderRadius: 2,
              background: "linear-gradient(180deg, #818CF8, #38BDF8)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
            }}
          >
            Why Axion
          </span>
        </div>

        {/* Headline — three-tone typographic rhythm */}
        <div style={{ marginBottom: 24 }}>
          {/* Line 1 */}
          <div
            style={{
              fontSize: "clamp(40px, 6.5vw, 72px)",
              fontWeight: 700,
              lineHeight: 1.05,
              opacity: headlineVisible ? 1 : 0,
              transform: headlineVisible ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <span style={{ color: "#ffffff" }}>Cloud compute, </span>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>rebuilt for</span>
          </div>
          {/* Line 2 — gradient */}
          <div
            style={{
              fontSize: "clamp(40px, 6.5vw, 72px)",
              fontWeight: 700,
              lineHeight: 1.05,
              backgroundImage: "linear-gradient(120deg, #818CF8, #38BDF8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              opacity: headlineVisible ? 1 : 0,
              transform: headlineVisible ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.6s ease 0.08s, transform 0.6s ease 0.08s",
            }}
          >
            crypto.
          </div>
        </div>

        {/* Body copy — no container */}
        <p
          style={{
            fontSize: 16,
            fontWeight: 400,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.75,
            maxWidth: 480,
            marginBottom: 80,
            opacity: headlineVisible ? 1 : 0,
            transform: headlineVisible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.6s ease 0.16s, transform 0.6s ease 0.16s",
          }}
        >
          Axion is an early-access experiment in decentralized infrastructure.
          We're building the primitives for a world where compute is as
          permissionless as money.
        </p>

        {/* Feature list — no cards, pure spatial rhythm */}
        <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.title} {...f} delay={i * 60} />
          ))}
        </div>
      </div>

      {/* Floating devnet pill — not a full-width bar */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          maxWidth: 600,
          width: "calc(100% - 48px)",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 100,
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {/* Pulsing amber dot */}
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#F59E0B",
            flexShrink: 0,
            animation: "axion-pulse 2.5s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.1em",
            color: "#F59E0B",
            flexShrink: 0,
          }}
        >
          EARLY ACCESS · DEVNET
        </span>
        <span
          style={{
            width: 1,
            height: 14,
            background: "rgba(255,255,255,0.12)",
            flexShrink: 0,
          }}
        />
        <span
          style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", minWidth: 0 }}
        >
          Real smart contracts, real transactions — no mainnet funds at risk.
        </span>
      </div>

      {/* Pulse keyframe */}
      <style>{`
        @keyframes axion-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.4; }
        }
      `}</style>
    </section>
  );
}
