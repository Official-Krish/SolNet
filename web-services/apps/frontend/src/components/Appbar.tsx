import { useState } from "react";
import { Button } from "./ui/button";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { NavbarItems } from "./NavbarItems";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocation } from "react-router-dom";
import UserProfileDropdown from "./user-dropdown";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";

export const Appbar = () => {
  const { wallet } = useWallet();
  const [hovered, setHovered] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "Rent VM", link: "/rent" },
    { name: "Deploy Container", link: "/depin/deploy" },
    { name: "Earn with Hardware" },
  ];

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <motion.div
        className={`w-full px-4 py-2 backdrop-blur-md
          bg-white/80 dark:bg-neutral-950/80
          ${
            scrolled
              ? "rounded-full border border-black/[0.06] dark:border-neutral-800 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]"
              : "rounded-xl border-b border-black/[0.06] dark:border-neutral-800"
          }`}
        animate={{
          width: scrolled ? "60%" : "100%",
          transition: { duration: 0.3, ease: "easeInOut" },
          y: scrolled ? 20 : 0,
        }}
        style={{ position: "fixed", left: "0", right: "0", margin: "0 auto" }}
      >
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div
            className="flex items-center gap-2 p-4 cursor-pointer"
            onClick={() => (window.location.href = "/")}
          >
            <img
              src="https://assets.krishdev.xyz/DeCloud/Logo.png"
              className="rounded-full"
              alt="logo"
              width={30}
              height={30}
            />
            <span className="font-medium text-zinc-950 dark:text-white">
              SolNet
            </span>
          </div>

          {/* Nav items */}
          <div className="flex items-center max-w-xl">
            {navItems.map((item, idx) => (
              <motion.div
                key={item.name}
                className="relative px-4 py-2 text-zinc-600 hover:text-zinc-950 dark:text-neutral-300 dark:hover:text-white cursor-pointer transition-colors"
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => item.link && (window.location.href = item.link)}
              >
                {hovered === idx && (
                  <motion.div
                    className="absolute inset-0 rounded-xl w-full h-full bg-zinc-100 dark:bg-neutral-800"
                    layoutId="nav-item"
                  />
                )}
                {item.name !== "Earn with Hardware" && (
                  <span className="relative flex items-center gap-1.5">
                    {location.pathname === item.link && (
                      <motion.span
                        layoutId="nav-dot"
                        className="w-1.5 h-1.5 rounded-full bg-violet-500"
                      />
                    )}
                    {item.name}
                  </span>
                )}
                {item.name === "Earn with Hardware" && <NavbarItems />}
              </motion.div>
            ))}
          </div>

          {/* CTA / Wallet */}
          <div className="flex items-center gap-2">
            <AnimatedThemeToggler />
            {localStorage.getItem("token") && wallet?.adapter.connected ? (
              <button
                className="space-x-2 flex items-center cursor-pointer text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-2 py-2 rounded-xl transition-colors"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <img
                  src={wallet.adapter.icon || ""}
                  alt="Wallet Address"
                  className="h-8 w-8 rounded-full"
                />
                <span className="ml-2 text-sm font-semibold">
                  {wallet?.adapter.publicKey
                    ?.toString()
                    .slice(0, 10)
                    .concat("...") || ""}
                </span>
              </button>
            ) : (
              <Button
                className="px-4 py-2 cursor-pointer
                  bg-transparent
                  border border-violet-500/40 dark:border-violet-500/50
                  text-violet-700 dark:text-violet-300
                  hover:bg-violet-500/10 hover:border-violet-500/70 dark:hover:border-violet-400
                  hover:shadow-[0_0_12px_rgba(139,92,246,0.15)]
                  transition-all duration-300 rounded-lg"
                onClick={() => (window.location.href = "/signin")}
              >
                SignIn
              </Button>
            )}
          </div>

          <UserProfileDropdown
            isOpen={userDropdownOpen}
            onClose={() => setUserDropdownOpen(false)}
          />
        </div>
      </motion.div>
    </div>
  );
};
