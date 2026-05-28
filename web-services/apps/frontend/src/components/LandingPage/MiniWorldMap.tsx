/**
 * MiniWorldMap
 *
 * A production-ready 2D mini world map for the hero right column.
 *
 * - Reuses the existing Natural Earth GeoJSON (`globe.json`) already
 *   bundled for the 3D globe — no new dependency, no extra network call.
 * - Each country polygon is projected with a simple equirectangular
 *   projection and rendered as an SVG <path> with a tiny-dot SVG pattern
 *   fill, giving the recognisable "dot-matrix" world map aesthetic
 *   (Stripe / Cloudflare / Vercel style).
 * - Active regions are overlaid as glowing, pulsing markers with hover
 *   tooltips that show region + latency.
 * - A compact HUD card sits inside the map showing the live network
 *   stats with the new copy.
 */
import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import countries from "@/data/globe.json";

/* ───────────────────────────── projection ──────────────────────────── */

// Map viewBox. We crop polar regions so the visible map feels balanced.
const W = 800;
const H = 400;
const LAT_MIN = -58; // hide Antarctica — visually noisy and not a region
const LAT_MAX = 78; //  hide thin top fringe

const project = (lng: number, lat: number): [number, number] => {
  const x = ((lng + 180) / 360) * W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;
  return [x, y];
};

/** Build SVG path data for every country polygon (precomputed once). */
function buildCountryPaths(): string[] {
  type Ring = number[][];
  type Geom =
    | { type: "Polygon"; coordinates: Ring[] }
    | { type: "MultiPolygon"; coordinates: Ring[][] };

  const paths: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const features = (countries as any).features as Array<{ geometry: Geom }>;

  for (const f of features) {
    const polygons: Ring[][] =
      f.geometry.type === "Polygon"
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;

    for (const polygon of polygons) {
      let d = "";
      for (const ring of polygon) {
        if (ring.length < 3) continue;
        ring.forEach((coord, i) => {
          const [lng, lat] = coord;
          if (lat < LAT_MIN || lat > LAT_MAX) return;
          const [x, y] = project(lng, lat);
          d += (i === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2) + " ";
        });
        d += "Z ";
      }
      if (d) paths.push(d.trim());
    }
  }
  return paths;
}

// Compute once at module load — the result is shared across re-renders.
const COUNTRY_PATHS = buildCountryPaths();

/* ───────────────────────────── regions ─────────────────────────────── */

type Region = {
  id: string;
  label: string;
  city: string;
  lat: number;
  lng: number;
  latency: string;
  type: "AWS" | "GCP" | "DePIN";
  primary?: boolean;
};

const REGIONS: Region[] = [
  {
    id: "us-east",
    label: "US-EAST",
    city: "N. Virginia",
    lat: 38.9,
    lng: -77.0,
    latency: "12ms",
    type: "AWS",
  },
  {
    id: "us-west",
    label: "US-WEST",
    city: "Oregon",
    lat: 45.5,
    lng: -122.6,
    latency: "8ms",
    type: "GCP",
  },
  {
    id: "depin-na",
    label: "DePIN-NA",
    city: "San Francisco",
    lat: 37.77,
    lng: -122.42,
    latency: "11ms",
    type: "DePIN",
  },
  {
    id: "eu-west",
    label: "EU-WEST",
    city: "London",
    lat: 51.5,
    lng: -0.13,
    latency: "18ms",
    type: "AWS",
    primary: true,
  },
  {
    id: "depin-eu",
    label: "DePIN-EU",
    city: "Frankfurt",
    lat: 50.11,
    lng: 8.68,
    latency: "21ms",
    type: "DePIN",
  },
  {
    id: "asia-pac",
    label: "ASIA-PAC",
    city: "Tokyo",
    lat: 35.68,
    lng: 139.69,
    latency: "32ms",
    type: "GCP",
  },
  {
    id: "depin-apac",
    label: "DePIN-APAC",
    city: "Singapore",
    lat: 1.35,
    lng: 103.82,
    latency: "29ms",
    type: "DePIN",
  },
  {
    id: "sa-east",
    label: "SA-EAST",
    city: "São Paulo",
    lat: -23.55,
    lng: -46.63,
    latency: "62ms",
    type: "AWS",
  },
];

const regionColor = (t: Region["type"]) => {
  switch (t) {
    case "AWS":
      return "#9945FF"; // Solana purple
    case "GCP":
      return "#38BDF8"; // sky
    case "DePIN":
      return "#22D3EE"; // cyan
  }
};

/* ───────────────────────────── component ───────────────────────────── */

export default function MiniWorldMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Region | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const projected = useMemo(
    () => REGIONS.map((r) => ({ ...r, xy: project(r.lng, r.lat) })),
    [],
  );

  const closest = REGIONS.find((r) => r.primary) ?? REGIONS[3];

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[520px] ml-auto"
    >
      {/* Soft purple bloom behind the map */}
      <div
        aria-hidden
        className="absolute -inset-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 60% 50%, rgba(153,69,255,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-md p-4 overflow-hidden shadow-[inset_0_0_60px_rgba(153,69,255,0.06)]">
        {/* Top row: status pill */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-white/40 font-mono">
            Global mesh
          </span>
          <span className="flex items-center gap-1.5 text-[10px] tracking-wider text-emerald-400 font-mono">
            <span className="relative flex w-1.5 h-1.5">
              <motion.span
                className="absolute inset-0 rounded-full bg-emerald-400"
                animate={{ scale: [1, 2.4, 1], opacity: [0.6, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
            DEVNET LIVE
          </span>
        </div>

        {/* Map */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto block"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Dot pattern for the dot-matrix continent fill (light theme) */}
              <pattern
                id="mwm-dots"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="1.5"
                  cy="1.5"
                  r="1.05"
                  className="fill-zinc-700 dark:fill-white/85"
                />
              </pattern>

              {/* Soft glow filter for active region markers */}
              <filter
                id="mwm-glow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Continents: stronger base silhouette + crisp dot-pattern overlay */}
            <g
              className="text-zinc-500 dark:text-white"
              style={{ color: "currentColor" }}
            >
              {/* Base silhouette — visible enough to read country shapes */}
              {COUNTRY_PATHS.map((d, i) => (
                <path
                  key={`base-${i}`}
                  d={d}
                  fill="currentColor"
                  className="opacity-20 dark:opacity-[0.14]"
                />
              ))}
              {/* Dot-matrix overlay — bright dots punch through */}
              {COUNTRY_PATHS.map((d, i) => (
                <path
                  key={`dots-${i}`}
                  d={d}
                  fill="url(#mwm-dots)"
                  className="opacity-90"
                />
              ))}
            </g>

            {/* Connection arcs between major hubs (subtle) */}
            <g
              stroke="rgba(153,69,255,0.35)"
              strokeWidth="0.6"
              fill="none"
              strokeLinecap="round"
            >
              {[
                ["us-east", "eu-west"],
                ["eu-west", "asia-pac"],
                ["us-west", "asia-pac"],
                ["depin-eu", "depin-apac"],
                ["us-east", "sa-east"],
              ].map(([a, b], i) => {
                const A = projected.find((p) => p.id === a)!;
                const B = projected.find((p) => p.id === b)!;
                const [ax, ay] = A.xy;
                const [bx, by] = B.xy;
                const mx = (ax + bx) / 2;
                const my = (ay + by) / 2 - Math.abs(bx - ax) * 0.18;
                return (
                  <motion.path
                    key={i}
                    d={`M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.7 }}
                    transition={{
                      delay: 1.0 + i * 0.15,
                      duration: 1.2,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    strokeDasharray="2 3"
                  />
                );
              })}
            </g>

            {/* Region markers */}
            <g filter="url(#mwm-glow)">
              {projected.map((r, i) => {
                const [x, y] = r.xy;
                const c = regionColor(r.type);
                return (
                  <g key={r.id}>
                    {/* Outer pulsing halo */}
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={4}
                      fill={c}
                      initial={{ opacity: 0 }}
                      animate={{
                        r: [4, 14, 4],
                        opacity: [0.55, 0, 0],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.4,
                        delay: i * 0.25,
                        ease: "easeOut",
                      }}
                    />
                    {/* Inner steady dot — interactive */}
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={r.primary ? 3.4 : 2.6}
                      fill={c}
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth={0.6}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.0 + i * 0.07, duration: 0.4 }}
                      style={{
                        transformOrigin: `${x}px ${y}px`,
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        const rect = wrapRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        setHovered(r);
                        setTooltipPos({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        });
                      }}
                      onMouseMove={(e) => {
                        const rect = wrapRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        setTooltipPos({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        });
                      }}
                      onMouseLeave={() => {
                        setHovered(null);
                        setTooltipPos(null);
                      }}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Tooltip */}
          <AnimatePresence>
            {hovered && tooltipPos && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+10px)]"
                style={{ left: tooltipPos.x, top: tooltipPos.y }}
              >
                <div className="px-2.5 py-1.5 rounded-md bg-zinc-950/95 border border-white/10 backdrop-blur-md shadow-lg whitespace-nowrap">
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: regionColor(hovered.type),
                        boxShadow: `0 0 8px ${regionColor(hovered.type)}`,
                      }}
                    />
                    <span className="text-white">{hovered.label}</span>
                    <span className="text-white/40">·</span>
                    <span className="text-white/70">{hovered.city}</span>
                    <span className="text-white/40">·</span>
                    <span className="text-white/60">{hovered.latency}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats HUD — real static info, no fake counters */}
        <div className="mt-4 grid grid-cols-2 gap-3 px-1">
          <Stat label="Providers" value="AWS · GCP · DePIN" />
          <Stat label="Regions" value="8 active" />
        </div>

        <div className="h-px bg-black/[0.08] dark:bg-white/10 mt-4" />

        <div className="mt-3 px-1 space-y-1.5">
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="text-zinc-600 dark:text-white/50">
              Closest node
            </span>
            <span className="font-mono text-zinc-900 dark:text-white">
              {closest.city}
              <span className="text-zinc-400 dark:text-white/40 ml-2">
                {closest.latency} latency
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500/90 dark:text-emerald-400/90">
            <svg
              viewBox="0 0 12 12"
              className="w-2.5 h-2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7l3-3 3 3"
              />
            </svg>
            Network healthy
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-white/40">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm text-zinc-900 dark:text-white tabular-nums">
        {value}
      </div>
    </div>
  );
}
