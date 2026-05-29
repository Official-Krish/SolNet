import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, User, ArrowRight, WalletIcon } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import "@solana/wallet-adapter-react-ui/styles.css";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AxionLogo } from "@/components/AxionLogo";

export function SignUp() {
  const wallet = useWallet();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!wallet.connected) {
      alert("Please connect your wallet first.");
      setIsLoading(false);
      return;
    }
    try {
      const res = await axios.post(`${BACKEND_URL}/user/signup`, {
        ...formData,
        publicKey: wallet.publicKey?.toString(),
      });
      if (res.status === 200) {
        toast.success("Account created successfully!", {
          position: "bottom-right",
        });
        localStorage.setItem("token", `Bearer ${res.data.token}`);
        localStorage.setItem("email", formData.email);
        setFormData({ name: "", email: "" });
        navigate("/dashboard");
      } else {
        toast.error("Failed to create account. Please try again.", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error("Error creating account:", error);
    }
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4 mt-10">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-48 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-64 bg-gradient-to-br from-secondary/10 to-muted/10 rounded-3xl blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div className="flex items-center justify-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full">
                <AxionLogo size={40} />
              </div>
              <span className="text-2xl font-bold">Axion</span>
            </motion.div>

            <motion.div>
              <CardTitle className="text-2xl font-bold">
                Create Account
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Join the decentralized cloud revolution
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            <motion.div>
              {wallet.connected ? (
                <div
                  className="flex items-center justify-center mb-4 cursor-pointer"
                  onClick={() => wallet.disconnect()}
                >
                  <img
                    src={wallet.wallet?.adapter.icon}
                    alt="Wallet Icon"
                    className="h-8 w-8 rounded-full mr-2"
                  />
                  {wallet?.publicKey?.toString().slice(0, 10).concat("...") ||
                    ""}
                </div>
              ) : (
                <div className="flex items-center justify-center mb-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 group rounded-lg">
                  <WalletMultiButton className="rounded-2xl w-full bg-primary">
                    <WalletIcon className="h-8 w-8 text-white" />
                    <span className="ml-2 text-lg font-semibold ">
                      Connect Wallet
                    </span>
                  </WalletMultiButton>
                </div>
              )}
            </motion.div>

            <motion.form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <Label htmlFor="name" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Full Name</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <Button
                type="submit"
                className="w-full group cursor-pointer"
                disabled={
                  !formData.email || !formData.name || !wallet?.connected
                }
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.form>

            <motion.div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <a
                  href="/signin"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </a>
              </p>
            </motion.div>

            <motion.div className="text-center">
              <p className="text-xs text-muted-foreground">
                By creating an account, you agree to our{" "}
                <a href="#terms" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
