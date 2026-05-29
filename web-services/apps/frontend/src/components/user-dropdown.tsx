import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "motion/react";
import {
  IconUser,
  IconDeviceDesktopAnalytics,
  IconCreditCard,
  IconCoins,
  IconDashboard,
  IconLogout,
  IconCopy,
  IconCheck,
  IconWallet,
} from "@tabler/icons-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  network?: "devnet" | "mainnet";
  balance?: number;
  onSignOut?: () => void;
}

const ProfileDropdown = ({
  isOpen,
  onClose,
  network = "devnet",
  balance = 0,
  onSignOut,
}: ProfileDropdownProps) => {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userEmail = localStorage.getItem("email") || "";
  const displayName = userEmail.split("@")[0] || "User";
  const initials = displayName[0].toUpperCase();
  const shortWallet = publicKey
    ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
    : "";
  const sessionWallet = publicKey
    ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
    : "";
  const solBalance = balance > 0 ? `${balance.toFixed(2)} SOL` : "0.00 SOL";

  const handleSignOut = useCallback(() => {
    if (onSignOut) {
      onSignOut();
    } else {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    onClose();
  }, [onSignOut, onClose]);

  const copyWallet = useCallback(() => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 400);
  }, [publicKey]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={onClose} />
          <motion.div
            ref={dropdownRef}
            role="menu"
            className="absolute right-0 top-full mt-2 w-[280px] bg-[#0D0D12] border border-[rgba(255,255,255,0.07)] rounded-xl backdrop-blur-[8px] z-40 overflow-hidden max-h-[480px] overflow-y-auto custom-scroll"
            initial={{ opacity: 0, y: -6 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.15, ease: "easeOut" },
            }}
            exit={{
              opacity: 0,
              y: -6,
              transition: { duration: 0.1, ease: "easeIn" },
            }}
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.08) transparent",
            }}
          >
            {/* HEADER ZONE */}
            <div
              className="px-4 pt-5 pb-3"
              onMouseEnter={() => setHeaderHovered(true)}
              onMouseLeave={() => setHeaderHovered(false)}
            >
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-white text-sm font-semibold">
                    {initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#14F195] border-2 border-[#0D0D12]">
                    <div className="absolute inset-0 rounded-full bg-[#14F195] animate-ping opacity-60" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[15px] font-medium text-white truncate"
                    style={{ fontFamily: "Inter, Geist, sans-serif" }}
                  >
                    {displayName}
                  </p>
                  <p className="text-[13px] text-zinc-400 truncate mt-0.5">
                    {userEmail}
                  </p>
                  {publicKey && (
                    <div
                      className="flex items-center gap-1.5 mt-1.5 group/addr cursor-pointer"
                      onClick={copyWallet}
                    >
                      <IconWallet className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="text-xs font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-md truncate max-w-[130px]">
                        {shortWallet}
                      </span>
                      <div
                        className={`transition-opacity duration-150 ${headerHovered ? "opacity-100" : "opacity-0"}`}
                      >
                        {copied ? (
                          <IconCheck className="w-3 h-3 text-[#14F195]" />
                        ) : (
                          <IconCopy className="w-3 h-3 text-zinc-500 hover:text-zinc-300" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                {network === "devnet" ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <div className="relative w-2 h-2">
                      <div className="absolute inset-0 rounded-full bg-amber-400" />
                      <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-60" />
                    </div>
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                      Devnet
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#14F195]/10 border border-[#14F195]/20">
                    <div className="relative w-2 h-2">
                      <div className="absolute inset-0 rounded-full bg-[#14F195]" />
                      <div className="absolute inset-0 rounded-full bg-[#14F195] animate-ping opacity-60" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#14F195] uppercase tracking-wider">
                      Mainnet
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* STATS ROW */}
            <div className="mx-4 mb-3 grid grid-cols-1 rounded-lg bg-[#1A1A24] border border-[rgba(255,255,255,0.04)] overflow-hidden">
              <div className="flex flex-col items-center justify-center py-2.5">
                <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
                  Balance
                </span>
                <span className="text-[16px] font-medium text-white mt-0.5">
                  {solBalance}
                </span>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="mx-4 h-px bg-[rgba(255,255,255,0.06)]" />

            {/* ACTION GROUP 1 — Account */}
            <div className="px-2 py-1.5">
              <MenuItem
                icon={IconUser}
                label="Profile"
                onClick={() => {
                  navigate("/profile");
                  onClose();
                }}
              />
            </div>

            {/* DIVIDER */}
            <div className="mx-4 h-px bg-[rgba(255,255,255,0.06)]" />

            {/* ACTION GROUP 2 — Compute */}
            <div className="px-2 py-1.5">
              <MenuItem
                icon={IconDashboard}
                label="My VMs"
                onClick={() => {
                  navigate("/dashboard");
                  onClose();
                }}
              />
              <MenuItem
                icon={IconCreditCard}
                label="Billing"
                onClick={() => {
                  navigate("/billing");
                  onClose();
                }}
                right={
                  <span className="text-[11px] font-mono text-zinc-500">
                    {solBalance}
                  </span>
                }
              />
              <MenuItem
                icon={IconCoins}
                label="Rewards"
                onClick={() => {
                  navigate("/depin/rewards");
                  onClose();
                }}
              />
            </div>

            {/* DIVIDER */}
            <div className="mx-4 h-px bg-[rgba(255,255,255,0.06)]" />

            {/* ACTION GROUP 3 — Host */}
            <div className="px-2 py-1.5">
              <MenuItem
                icon={IconDeviceDesktopAnalytics}
                label="Host Dashboard"
                onClick={() => {
                  navigate("/depin/host/dashboard");
                  onClose();
                }}
              />
            </div>

            {/* FOOTER — Sign Out */}
            <div className="border-t border-[rgba(255,255,255,0.06)] px-2 py-1.5">
              <div
                role="menuitem"
                tabIndex={0}
                onClick={handleSignOut}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSignOut();
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-[#F87171] hover:text-red-300 transition-colors duration-80 group/signout focus:outline-none focus:ring-2 focus:ring-[#9945FF] focus:ring-offset-2 focus:ring-offset-[#0D0D12]"
              >
                <div className="flex items-center gap-2.5">
                  <IconLogout className="w-4 h-4" />
                  <span className="text-[13px] font-medium">Sign Out</span>
                </div>
                {publicKey && (
                  <span className="text-[11px] text-zinc-600 font-mono">
                    {sessionWallet}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

function MenuItem({
  icon: Icon,
  label,
  onClick,
  right,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div
      role="menuitem"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick?.();
      }}
      className="group/menu relative flex items-center justify-between px-3 py-[7px] rounded-lg cursor-pointer text-zinc-400 hover:text-white transition-all duration-80 hover:bg-[#1E1E2C] focus:outline-none focus:ring-2 focus:ring-[#9945FF] focus:ring-offset-2 focus:ring-offset-[#0D0D12]"
    >
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-gradient-to-b from-[#9945FF] to-[#14F195] opacity-0 group-hover/menu:opacity-100 transition-all duration-80 -translate-x-0.5 group-hover/menu:translate-x-0" />
      <div className="flex items-center gap-2.5 pl-2">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-[13px] font-medium">{label}</span>
      </div>
      {right}
    </div>
  );
}

export default ProfileDropdown;
