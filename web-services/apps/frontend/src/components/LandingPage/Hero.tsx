import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export default function Hero() {
  const navigate = useNavigate();

  // structured orbital rings
  const orbits = [
    { r: 120, count: 4, speed: 28 },
    { r: 195, count: 6, speed: 46 },
    { r: 270, count: 8, speed: 70 },
  ];

  return (
    <section className="relative w-full min-h-screen bg-[#050508] overflow-hidden flex items-center pt-24 pb-12">
      {/* ambient glows */}
      <div className="absolute top-[20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-violet-700/15 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-fuchsia-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-[60%] right-[20%] w-[400px] h-[400px] rounded-full bg-cyan-500/8 blur-[120px] pointer-events-none" />

      <Stars />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
        {/* LEFT — copy */}
        <div className="flex flex-col gap-8">
          {/* Badge — clean, just logo + label */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 w-fit text-xs font-medium tracking-[0.18em] text-white/55 uppercase"
          >
            <img
              src="/solana.png"
              className="w-4 h-4 rounded-full"
              alt="Solana"
            />
            <span>Built on Solana</span>
          </motion.div>

          {/* Headline — one weight, one gradient phrase, no italic, no trailing period */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.25rem] font-black tracking-tight text-white leading-[0.98]"
          >
            Cloud built for
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
              the on-chain era
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-lg text-white/50 max-w-lg leading-relaxed"
          >
            Rent AWS, GCP, or decentralized VMs in seconds — pay with SOL. No
            credit cards. No KYC. Just compute.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex items-center gap-7 pt-2"
          >
            {/* Primary — no underline */}
            <button
              onClick={() => navigate("/dashboard")}
              className="group flex items-center gap-3 text-base font-semibold text-white cursor-pointer"
            >
              <span>Launch app</span>
              <span className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-[0_0_0_rgba(168,85,247,0)] transition-all duration-300 group-hover:translate-x-1 group-hover:shadow-[0_0_28px_rgba(168,85,247,0.5)]">
                <ArrowRight className="w-4 h-4 text-white" />
              </span>
            </button>

            {/* Secondary — with arrow icon */}
            <button
              onClick={() => navigate("/hosting")}
              className="group flex items-center gap-1.5 text-sm font-medium text-white/55 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              Earn as a host
              <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </motion.div>
        </div>

        {/* RIGHT — orbital network */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="relative h-[580px] hidden lg:flex items-center justify-center"
        >
          {/* SVG telemetry lines connecting labels to outer orbit */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 600 580"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="100%" stopColor="rgba(168,85,247,0)" />
              </linearGradient>
            </defs>
            {/* top-right label → outer orbit */}
            <path
              d="M 470 92 Q 430 140 405 175"
              stroke="url(#lineGrad)"
              strokeWidth="1"
              strokeDasharray="2 4"
              fill="none"
            />
            {/* top-left label → outer orbit */}
            <path
              d="M 80 168 Q 140 195 175 220"
              stroke="url(#lineGrad)"
              strokeWidth="1"
              strokeDasharray="2 4"
              fill="none"
            />
            {/* bottom-right label → outer orbit */}
            <path
              d="M 480 460 Q 435 410 405 380"
              stroke="url(#lineGrad)"
              strokeWidth="1"
              strokeDasharray="2 4"
              fill="none"
            />
            {/* bottom-left label → outer orbit */}
            <path
              d="M 80 470 Q 140 420 180 380"
              stroke="url(#lineGrad)"
              strokeWidth="1"
              strokeDasharray="2 4"
              fill="none"
            />
          </svg>

          {/* orbit rings */}
          {orbits.map((orbit, idx) => (
            <div
              key={idx}
              className="absolute rounded-full border border-white/[0.06]"
              style={{ width: orbit.r * 2, height: orbit.r * 2 }}
            />
          ))}

          {/* pulsing rings around core */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`pulse-${i}`}
              className="absolute rounded-full border border-violet-500/40"
              animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
              transition={{
                duration: 3,
                delay: i * 1,
                repeat: Infinity,
                ease: "easeOut",
              }}
              style={{ width: 112, height: 112 }}
            />
          ))}

          {/* center core — layered glows + inner ring */}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-20"
          >
            {/* outer wash */}
            <div className="absolute inset-0 rounded-full bg-violet-500 blur-3xl opacity-50 scale-[2.2]" />
            {/* mid wash */}
            <div className="absolute inset-0 rounded-full bg-fuchsia-500 blur-2xl opacity-45 scale-[1.5]" />
            {/* core sphere */}
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center shadow-[0_0_80px_rgba(168,85,247,0.7)]">
              {/* inner ring */}
              <div className="absolute inset-2 rounded-full border border-white/25" />
              <div className="absolute inset-4 rounded-full border border-white/15" />
              <img
                src="/solana.png"
                alt="Solana"
                className="w-11 h-11 rounded-full relative z-10"
              />
            </div>
          </motion.div>

          {/* orbital nodes — bigger, more visible */}
          {orbits.map((orbit, oi) => (
            <motion.div
              key={oi}
              className="absolute"
              style={{ width: orbit.r * 2, height: orbit.r * 2 }}
              animate={{ rotate: 360 }}
              transition={{
                duration: orbit.speed,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {Array.from({ length: orbit.count }).map((_, i) => {
                const angle = (i / orbit.count) * 360;
                const palette = [
                  { dot: "bg-violet-400", shadow: "shadow-violet-400/70" },
                  { dot: "bg-fuchsia-400", shadow: "shadow-fuchsia-400/70" },
                  { dot: "bg-cyan-400", shadow: "shadow-cyan-400/70" },
                  { dot: "bg-emerald-400", shadow: "shadow-emerald-400/70" },
                ];
                const c = palette[(i + oi) % palette.length];
                const size = oi === 2 ? 3.5 : oi === 1 ? 4 : 5;
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2"
                    style={{
                      transform: `rotate(${angle}deg) translate(${orbit.r}px) rotate(-${angle}deg)`,
                    }}
                  >
                    <div
                      className={`relative rounded-full ${c.dot} shadow-[0_0_18px] ${c.shadow}`}
                      style={{ width: size * 2, height: size * 2 }}
                    >
                      <div
                        className={`absolute inset-0 rounded-full ${c.dot} animate-ping opacity-60`}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ))}

          {/* floating data labels — connected to nodes via SVG lines */}
          <FloatingLabel text="us-east-1" x="76%" y="14%" delay={0.7} />
          <FloatingLabel text="≤ 1s settlement" x="4%" y="28%" delay={1.0} />
          <FloatingLabel text="0.001 SOL fee" x="78%" y="76%" delay={1.3} />
          <FloatingLabel text="65k TPS" x="4%" y="78%" delay={1.6} />
        </motion.div>
      </div>
    </section>
  );
}

const FloatingLabel = ({
  text,
  x,
  y,
  delay,
}: {
  text: string;
  x: string;
  y: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
    transition={{
      opacity: { duration: 0.5, delay },
      scale: { duration: 0.5, delay },
      y: { duration: 4, delay, repeat: Infinity, ease: "easeInOut" },
    }}
    className="absolute z-20 font-mono text-[11px] text-white/60 whitespace-nowrap pointer-events-none"
    style={{ left: x, top: y }}
  >
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
      <span className="tracking-wide">{text}</span>
    </div>
  </motion.div>
);

const Stars = () => {
  const stars = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    delay: Math.random() * 3,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white/40"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: s.delay,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
};
