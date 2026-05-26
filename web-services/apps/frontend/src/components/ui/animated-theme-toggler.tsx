"use client";

import { Moon, SunDim } from "lucide-react";
import { useRef } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/themeProvider";

type Props = {
  className?: string;
};

/**
 * AnimatedThemeToggler — circular clip-path reveal via View Transitions API.
 * Falls back to plain toggle when View Transitions are unsupported (Safari, FF).
 */
export const AnimatedThemeToggler = ({ className }: Props) => {
  const { theme, setTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = async () => {
    const nextTheme = isDark ? "light" : "dark";

    // Fallback for browsers without View Transitions API
    if (!("startViewTransition" in document) || !buttonRef.current) {
      setTheme(nextTheme);
      return;
    }

    // startViewTransition is well-supported in Chromium; types may not be present in older TS lib.dom
    const transition = (
      document as Document & {
        startViewTransition: (cb: () => void) => { ready: Promise<void> };
      }
    ).startViewTransition(() => {
      flushSync(() => setTheme(nextTheme));
    });

    await transition.ready;

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const y = top + height / 2;
    const x = left + width / 2;
    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRad}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 600,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  };

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors",
        "text-zinc-700 hover:bg-zinc-100",
        "dark:text-zinc-300 dark:hover:bg-white/[0.06]",
        className,
      )}
    >
      {isDark ? <SunDim className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};
