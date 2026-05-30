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
import { Mail, ArrowRight, WalletIcon } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useNavigate } from "react-router-dom";
import { AxionLogo } from "@/components/AxionLogo";
import { toast } from "sonner";

export function SignIn() {
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!wallet?.adapter.connected) {
      toast.error("Please connect your wallet first.");
      setIsLoading(false);
      return;
    }
    try {
      const res = await axios.post(`${BACKEND_URL}/user/login`, {
        ...formData,
        publicKey: wallet.adapter.publicKey?.toString(),
      });
      if (res.status === 200) {
        toast.success("Successfully signed in!");
        localStorage.setItem("token", `Bearer ${res.data.token}`);
        localStorage.setItem("email", formData.email);
        setFormData({ email: "" });
        navigate("/dashboard");
      } else {
        toast.error("Failed to sign in. Please try again.");
        console.error("Failed to sign in:", res.data);
      }
    } catch (error) {
      console.error("Error signing in:", error);
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
              <div className="flex items-center justify-center w-10 h-10">
                <AxionLogo size={40} />
              </div>
              <span className="text-2xl font-bold">Axion</span>
            </motion.div>

            <motion.div>
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to your Axion account
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            <motion.div className="flex items-center justify-center mb-4">
              {wallet?.adapter.connected ? (
                <div
                  className="flex items-center justify-center mb-4 cursor-pointer"
                  onClick={() => wallet.adapter.disconnect()}
                >
                  <img
                    src={wallet?.adapter.icon}
                    alt="Wallet Icon"
                    className="h-8 w-8 rounded-full mr-2"
                  />
                  {wallet?.adapter.publicKey
                    ?.toString()
                    .slice(0, 10)
                    .concat("...") || ""}
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
                disabled={!formData.email || !wallet?.adapter.connected}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.form>

            <motion.div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </a>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
