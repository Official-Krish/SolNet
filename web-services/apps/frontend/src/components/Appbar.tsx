import { useState } from "react";
import { Button } from "./ui/button";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { NavbarItems } from "./NavbarItems";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import UserProfileDropdown from "./user-dropdown";

export const Appbar = () => {
    const { wallet } = useWallet();
    const navigate = useNavigate();
    const [hovered, setHovered] = useState<number | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const { scrollY } = useScroll();
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const navItems = [
        {
          name: "Dashboard",
          link: "/dashboard",
        },
        {
          name: "Rent VM",
          link: "/rent",
        },
        {
          name: "Deploy Image",
          link: "/depin/deploy",
        },
        {
            name: "DePIN Services",
        }
    ];
    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 40){
            setScrolled(true);
        } else {
            setScrolled(false);
        }
    });
    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <motion.div 
                className={`w-full px-4 py-2 ${scrolled ? "rounded-full border border-neutral-800" : "rounded-xl border-b border-neutral-800"}`}
                animate={{
                    width: scrolled ? "60%" : "100%",
                    transition: { 
                        duration: 0.3,
                        ease: "easeInOut"
                    },
                    y: scrolled ? 20 : 0,
                }}
                style={{ position: "fixed", left: "0", right: "0", margin: "0 auto" }}
            >
                <div className="flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-2 p-4 cursor-pointer"
                        onClick={() => navigate("/")}
                    >
                        <img
                            src="https://assets.krishdev.xyz/DeCloud/Logo.png"
                            className="rounded-full"
                            alt="logo"
                            width={30}
                            height={30}
                        />
                        <span className="font-medium text-black dark:text-white">SolNet</span>
                    </div>
                    <div className="flex items-center max-w-lg">
                        {navItems.map((item, idx) => (
                            <motion.div
                                key={item.name}
                                className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                                onMouseEnter={() => setHovered(idx)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => item.link && navigate(item.link)}
                            >
                                {hovered === idx && (
                                    <motion.div className="absolute inset-0 rounded-xl w-full h-full bg-neutral-800" layoutId="nav-item"/>
                                )}
                                {item.name !== "DePIN Services" && <span className="relative">{item.name}</span>}
                                {item.name === "DePIN Services" && (
                                    <NavbarItems/>
                                )}
                            </motion.div>
                            
                        ))}
                    </div>
                    <div className="flex items-center">
                        {(localStorage.getItem("token") && wallet?.adapter.connected) ?
                            <button 
                                className="space-x-2 flex items-center cursor-pointer text-neutral-600 bg-neutral-50 hover:bg-neutral-100 px-2 py-2 rounded-xl"
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            >
                                <img
                                    src={wallet.adapter.icon || ""}
                                    alt="Wallet Address"
                                    className="h-8 w-8 rounded-full"
                                />
                                <span className="ml-2 text-sm text-neutral-800 font-semibold">
                                    {wallet?.adapter.publicKey?.toString().slice(0,10).concat("...") || ""}
                                </span>
                            </button>
                            :
                            <Button 
                                className="px-4 py-2 hover:bg-neutral-200 cursor-pointer bg-neutral-100"
                                onClick={() => navigate("/signin")}
                            >
                                SignIn
                            </Button>
                        }
                    </div>
                    <UserProfileDropdown
                        isOpen={userDropdownOpen}
                        onClose={() => setUserDropdownOpen(false)}
                    />
                </div>
            </motion.div>
        </div>
    )
}