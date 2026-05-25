import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  LogOut,
  Wallet,
  Mail,
  Shield,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileDropdown = ({ isOpen, onClose }: UserProfileDropdownProps) => {
  const { wallet, publicKey } = useWallet();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
    onClose();
  };

  const isLoggedIn = localStorage.getItem("token");
  const userEmail = localStorage.getItem("email");

  const formatWalletAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.2 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={onClose} />

          {/* Dropdown */}
          <motion.div
            className="absolute right-0 top-full mt-2 w-80 bg-gradient-to-br from-background via-background to-muted/30  backdrop-blur-md border border-border rounded-xl shadow-2xl z-40 overflow-hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {isLoggedIn ? (
              <div className="p-6">
                {/* User Info Section */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-4 mb-6"
                >
                  <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                    <AvatarImage src={wallet?.adapter.icon} alt="User Avatar" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground truncate">
                        {userEmail || "user@example.com"}
                      </span>
                    </div>

                    {publicKey && (
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                          {formatWalletAddress(publicKey.toString())}
                        </span>
                        <Copy
                          className="w-4 h-4 text-muted-foreground cursor-pointer"
                          onClick={() => {
                            navigator.clipboard.writeText(publicKey.toString());
                            toast.success("Wallet address copied to clipboard");
                          }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>

                <Separator className="mb-4" />

                {/* Menu Items */}
                <motion.div variants={itemVariants} className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    Profile Settings
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    Security
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    Preferences
                  </Button>

                  <Separator className="my-2" />

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start gap-3 h-10 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="p-6">
                {/* Welcome Section */}
                <motion.div
                  variants={itemVariants}
                  className="text-center mb-6"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <User className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Welcome to SolNet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sign in to access your decentralized cloud dashboard
                  </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <Button
                    onClick={() => {
                      window.location.href = "/signin";
                      onClose();
                    }}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg"
                  >
                    Sign In
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      window.location.href = "/signup";
                      onClose();
                    }}
                    className="w-full border-border hover:bg-accent hover:text-accent-foreground"
                  >
                    Create Account
                  </Button>
                </motion.div>

                {/* Feature Highlight */}
                <motion.div
                  variants={itemVariants}
                  className="mt-4 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3" />
                    <span>Secured by Solana blockchain</span>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserProfileDropdown;
