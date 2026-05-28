import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import MiniWorldMap from "./MiniWorldMap";

/* ──────────────────────────────────────────────
   Mask-reveal — clip text up from below.
   ────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ──────────────────────────────────────────────
   Node field — sparse connected nodes behind
   the headline, left-anchored.
   ────────────────────────────────────────────── */
function NodeField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface N {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
    }
    const count = 38;
    const nodes: N[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.2 + 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(
            nodes[i].x - nodes[j].x,
            nodes[i].y - nodes[j].y,
          );
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(153,69,255,${(1 - d / 110) * 0.18})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Nodes
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(153,69,255,0.55)";
        ctx.fill();
      });

      raf.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.5 }}
    />
  );
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const center = () => ({ x: canvas.width / 2, y: canvas.height * 0.55 });

    interface Particle {
      x: number;
      y: number;
      angle: number;
      speed: number;
      life: number;
      hue: string;
    }

    const HUES = [
      "rgba(153, 69, 255,", // purple
      "rgba(99, 102, 241,", // indigo
      "rgba(56, 189, 248,", // sky
      "rgba(244, 114, 182,", // pink
    ];

    const count = Math.min(120, Math.floor(window.innerWidth / 14));
    const particles: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 400;
      const c = center();
      return {
        x: c.x + Math.cos(angle) * dist,
        y: c.y + Math.sin(angle) * dist,
        angle: angle + Math.PI,
        speed: 0.4 + Math.random() * 0.5,
        life: Math.random(),
        hue: HUES[Math.floor(Math.random() * HUES.length)],
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const c = center();

      particles.forEach((p) => {
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        p.life += p.speed / 240;

        if (p.life >= 1) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 200 + Math.random() * 400;
          p.x = c.x + Math.cos(angle) * dist;
          p.y = c.y + Math.sin(angle) * dist;
          p.angle = angle + Math.PI;
          p.life = 0;
          p.speed = 0.4 + Math.random() * 0.5;
          p.hue = HUES[Math.floor(Math.random() * HUES.length)];
        }

        const alpha = Math.sin(p.life * Math.PI) * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = p.hue + alpha + ")";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(
          p.x + Math.cos(p.angle) * 22 * 0.3,
          p.y + Math.sin(p.angle) * 22 * 0.3,
        );
        ctx.strokeStyle = p.hue + alpha * 0.45 + ")";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      });

      raf.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-90 pointer-events-none"
    />
  );
}

/* ──────────────────────────────────────────────
   Region ticker — dark variant.
   ────────────────────────────────────────────── */
function RegionTicker() {
  const items = [
    { name: "US-EAST", latency: "12ms", type: "AWS" },
    { name: "EU-WEST", latency: "18ms", type: "AWS" },
    { name: "ASIA-PAC", latency: "32ms", type: "GCP" },
    { name: "US-WEST", latency: "8ms", type: "GCP" },
    { name: "DePIN-EU", latency: "45ms", type: "DePIN" },
    { name: "DePIN-NA", latency: "39ms", type: "DePIN" },
    { name: "SA-EAST", latency: "62ms", type: "AWS" },
    { name: "DePIN-APAC", latency: "51ms", type: "DePIN" },
  ];
  const list = [...items, ...items];

  return (
    <div className="border-t border-black/[0.06] dark:border-white/[0.08] overflow-hidden relative z-10">
      <motion.div
        className="flex gap-12 py-5 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
      >
        {list.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-3 text-[11px] font-mono shrink-0"
          >
            <span className="w-1 h-1 rounded-full bg-amber-400" />
            <span className="text-zinc-600 dark:text-zinc-700 dark:text-white/60">
              {r.name}
            </span>
            <span className="text-zinc-500 dark:text-zinc-500 dark:text-white/40">
              {r.latency}
            </span>
            <span className="text-zinc-400 dark:text-white/25 uppercase tracking-widest">
              {r.type}
            </span>
            <span className="text-zinc-300 dark:text-white/15 ml-3">·</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Hero
   ────────────────────────────────────────────── */
export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col bg-[#F4F2F8] dark:bg-zinc-950 overflow-hidden">
      {/* Particle field — converges toward content */}
      <ParticleField />

      {/* Center glow halo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 50% 55%, rgba(153,69,255,0.18) 0%, rgba(244,114,182,0.06) 35%, transparent 70%)",
        }}
      />

      {/* Subtle top edge highlight */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)",
        }}
      />

      <div className="flex-1 flex items-center max-w-7xl mx-auto w-full px-6 lg:px-12 pt-24 pb-20 relative z-10">
        <div className="grid lg:grid-cols-12 gap-x-12 gap-y-16 items-center w-full">
          {/* Content */}
          <div className="lg:col-span-7 relative">
            {/* Background node visualization */}
            <div className="absolute inset-0 -z-10 overflow-hidden rounded-2xl">
              <NodeField />
              <div
                className="absolute inset-0 dark:hidden"
                style={{
                  background:
                    "radial-gradient(ellipse 60% 80% at 80% 50%, transparent 40%, rgba(244,242,248,0.95) 100%)",
                }}
              />
              <div
                className="absolute inset-0 hidden dark:block"
                style={{
                  background:
                    "radial-gradient(ellipse 60% 80% at 80% 50%, transparent 40%, rgba(9,9,11,0.95) 100%)",
                }}
              />
            </div>

            {/* Badge / pill */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 mb-6 px-3 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] backdrop-blur-sm"
            >
              <span className="relative flex w-1.5 h-1.5">
                <motion.span
                  className="absolute inset-0 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 2.6, 1], opacity: [0.6, 0, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-700 dark:text-white/70 font-mono">
                Live on Devnet
              </span>
              <span className="text-zinc-400 dark:text-white/30">—</span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-white/45 font-mono">
                Solana DePIN
              </span>
            </motion.div>

            {/* Headline */}
            <h2 className="text-[clamp(2.5rem,7.4vw,6.25rem)] font-light tracking-[-0.045em] leading-[0.98] mb-6">
              <Reveal delay={0.1}>
                <span
                  className="dark:hidden"
                  style={{
                    backgroundImage:
                      "linear-gradient(120deg, #7C3AED 0%, #9945FF 50%, #2563EB 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  The World's Compute Layer.
                </span>
                <span
                  className="hidden dark:inline"
                  style={{
                    backgroundImage:
                      "linear-gradient(120deg, #C4B5FD 0%, #F0ABFC 50%, #93C5FD 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  The World's Compute Layer.
                </span>
              </Reveal>
              <Reveal delay={0.25} className="text-zinc-500 dark:text-white/40">
                Powered by{" "}
                <span className="text-[#9945FF] dark:text-[#C4B5FD] font-normal">
                  Solana
                </span>
                .
              </Reveal>
            </h2>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.45,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-zinc-800 dark:text-white/80 text-lg lg:text-xl max-w-xl leading-snug mb-4 font-light"
            >
              Spin up bare-metal VMs in seconds.{" "}
              <span className="text-zinc-500 dark:text-white/45">
                No KYC. No contracts. Just compute.
              </span>
            </motion.p>

            {/* Pricing strip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.6,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-10"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] backdrop-blur-sm border border-black/[0.08] dark:border-white/10">
                <span className="text-zinc-500 dark:text-white/50 text-xs">
                  From
                </span>
                <span className="text-zinc-900 dark:text-white font-mono font-medium text-sm">
                  ~0.05 SOL
                </span>
                <span className="text-zinc-500 dark:text-white/40 text-xs">
                  / hr
                </span>
              </span>
              <span className="text-zinc-500 dark:text-white/45 text-xs font-mono">
                · Billed per second · Cancel instantly
              </span>{" "}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.7,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center gap-7"
            >
              <Link
                to="/rent"
                className="group relative inline-flex items-center gap-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-7 py-3.5 rounded-full text-sm font-medium hover:bg-zinc-800 dark:hover:bg-white/90 transition-all duration-300"
              >
                <span className="absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition-opacity" />
                <span className="relative">Start Computing</span>
                <svg
                  className="w-3.5 h-3.5 relative transition-transform duration-300 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <Link
                to="/hosting"
                className="group inline-flex items-center gap-2 text-zinc-700 dark:text-white/65 hover:text-zinc-950 dark:hover:text-white text-sm transition-colors duration-200"
              >
                <span>Earn by Hosting</span>
                <svg
                  className="w-3.5 h-3.5 -mr-0.5 opacity-50 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </motion.div>
          </div>

          {/* Mini world map */}
          <div className="lg:col-span-5 lg:flex justify-end hidden">
            <MiniWorldMap />
          </div>
        </div>
      </div>

      <RegionTicker />
    </section>
  );
}
