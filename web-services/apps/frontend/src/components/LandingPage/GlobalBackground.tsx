import { useEffect, useRef } from "react";

/**
 * GlobalBackground — dual theme atmospheric layer.
 * Dark theme: deep zinc base with rich purple/sky/mint/rose washes.
 * Light theme: warm cream-lavender base with soft pastel washes.
 * Layers: base → dot grid → 5 accent washes → floating particles → vignettes.
 */
export default function GlobalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      hue: string;
      pulse: number;
    }

    const COLORS = [
      "rgba(153,69,255,",
      "rgba(56,189,248,",
      "rgba(20,184,166,",
      "rgba(251,113,133,",
    ];

    const count = Math.min(28, Math.floor(window.innerWidth / 60));
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.6 + 0.6,
      hue: COLORS[Math.floor(Math.random() * COLORS.length)],
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains("dark");

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.012;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        const baseAlpha = isDark ? 0.35 : 0.18;
        const alpha = baseAlpha + Math.sin(p.pulse) * 0.12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.hue + alpha + ")";
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
    >
      {/* 1 — Base (themed) */}
      <div className="absolute inset-0 bg-[#F4F2F8] dark:bg-[#06060B]" />

      {/* 2 — Dot grid (themed) */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage:
            "radial-gradient(rgba(9,9,11,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 0%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 0%, transparent 80%)",
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 0%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 0%, transparent 80%)",
        }}
      />

      {/* 3 — Accent washes (slightly stronger on dark) */}
      <div
        className="absolute -top-[20%] -left-[15%] w-[65%] h-[80%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(153,69,255,0.20), rgba(153,69,255,0) 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute -top-[10%] -right-[15%] w-[55%] h-[70%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(251,113,133,0.14), rgba(251,113,133,0) 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="absolute top-[35%] -left-[10%] w-[45%] h-[55%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(56,189,248,0.12), rgba(56,189,248,0) 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute -bottom-[10%] -right-[10%] w-[55%] h-[60%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(20,184,166,0.10), rgba(20,184,166,0) 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute bottom-[20%] left-[35%] w-[40%] h-[40%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(139,92,246,0.10), rgba(139,92,246,0) 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* 4 — Floating particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.7 }}
      />

      {/* 5 — Vignettes (themed) */}
      <div
        className="absolute inset-x-0 top-0 h-32 dark:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(244,242,248,0.7), transparent)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-32 hidden dark:block"
        style={{
          background:
            "linear-gradient(to bottom, rgba(6,6,11,0.7), transparent)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40 dark:hidden"
        style={{
          background:
            "linear-gradient(to top, rgba(244,242,248,0.85), transparent)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40 hidden dark:block"
        style={{
          background: "linear-gradient(to top, rgba(6,6,11,0.85), transparent)",
        }}
      />
    </div>
  );
}
