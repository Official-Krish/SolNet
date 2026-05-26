import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Link } from "react-router-dom";

/**
 * FinalCTA — calm minimal closer.
 * After the dramatic dark hero and rich content body, the page ends quietly.
 * Big editorial headline, one CTA, a sign-off. That's it.
 */
export default function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative border-t border-black/[0.06] dark:border-white/[0.06] bg-transparent py-40 md:py-48 px-6 overflow-hidden"
    >
      {/* Single soft purple glow behind the headline */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(153,69,255,0.08), transparent 70%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Tiny eyebrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 mb-10"
        >
          <span className="h-px w-8 bg-zinc-300" />
          <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-500">
            Ready when you are
          </span>
          <span className="h-px w-8 bg-zinc-300" />
        </motion.div>

        {/* Main headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl md:text-6xl lg:text-7xl font-light text-zinc-950 dark:text-white leading-[1.05] tracking-[-0.04em] mb-12"
        >
          Spin up your first VM
          <br />
          <span className="text-zinc-400 dark:text-zinc-600">
            in under 30 seconds.
          </span>
        </motion.h2>

        {/* Single CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6"
        >
          <Link
            to="/rent-vm"
            className="group inline-flex items-center gap-2.5 bg-zinc-950 hover:bg-zinc-800 text-white px-8 py-3.5 rounded-full text-sm font-medium transition-all duration-300"
          >
            Launch Console
            <svg
              className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
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

          {/* Sign-off line */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span>No credit card</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>Devnet</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>Currently in early access</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <Link
              to="/hosting"
              className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Become a host instead
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
