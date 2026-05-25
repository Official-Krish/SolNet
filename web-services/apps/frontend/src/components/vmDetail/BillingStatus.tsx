import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Zap, Wallet } from "lucide-react";
import type { VM } from "types/vm";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { calculateEscrowEndTime, calculatePrice } from "@/lib/vm";
import { TopUpEscrowSession } from "@/lib/Escrow";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import axios from "axios";
import { BACKEND_URL } from "@/config";

export const BillingStatus = ({ vm }: { vm: VM }) => {
    const wallet = useAnchorWallet();
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState(0.1);
    const [additionalEscrowDuration, setAdditionalEscrowDuration] = useState(0);
    const [timeUsed, setTimeUsed] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const timeProgress = ((timeUsed / Number(vm.endTime)) * 100);

    const handleTopUp = async () => {
        if (topUpAmount < 0.1) {
            toast.error("Minimum top up amount is 0.1 SOL", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
            });
            return;
        }
        try {
            const tx = await TopUpEscrowSession(wallet!, vm.id, topUpAmount);
            if (tx && !tx.success) {
                toast.error("Failed to top up escrow balance", {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });
            }
            const res = await axios.post(`${BACKEND_URL}/vm/topup`, {
                id: vm.id,
                instanceId: vm.instanceId,
                amount: topUpAmount,
                additionalEscrowDuration: additionalEscrowDuration,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `${localStorage.getItem("token")}`,
                },
            })
            if (res.status === 200) {
                toast.success("Escrow balance topped up successfully", {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });
            }

        } catch (error) {
            console.error("Error during top up:", error);
            toast.error("Failed to top up escrow balance", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
            });
        }
        setIsTopUpOpen(false);
    };

    useEffect(() => {
        const calculateEscrowDuration = async () => {
            const endTime = await calculateEscrowEndTime(topUpAmount, vm.VMConfig.machineType, Number(vm.VMConfig.diskSize))
            setAdditionalEscrowDuration(Number(endTime));
            const timePassed = vm.createdAt ? Math.floor((Date.now() - new Date(vm.createdAt).getTime()) / 1000 / 60) : 0;
            const used = await calculatePrice(vm.VMConfig.machineType, Number(vm.VMConfig.diskSize), timePassed);
            setTimeUsed(Number(used));
            setTimeRemaining(new Date(vm.endTime).getTime() - Date.now());
        };
        calculateEscrowDuration();
    }, [topUpAmount]);
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        {<Wallet className="h-5 w-5" />}
                        <span>Escrow Balance</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold font-mono">{vm.price} SOL</div>
                                <div className="text-sm text-muted-foreground">Available Balance</div>
                            </div>
                            <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                                <DialogTrigger asChild>
                                    <Button className="flex items-center space-x-2 cursor-pointer">
                                        <Plus className="h-4 w-4" />
                                        <span>Top Up</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Top Up Escrow Balance</DialogTitle>
                                        <DialogDescription>
                                            Add funds to your escrow account to continue running your VM.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Amount (SOL)</Label>
                                            <Input
                                                type="number"
                                                min="0.1"
                                                step="0.001"
                                                value={topUpAmount}
                                                onChange={(e) => setTopUpAmount(parseFloat(e.target.value) || 0.1)}
                                                className="mt-2"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                ≈ {(additionalEscrowDuration / 1440).toFixed(3)} additional days of runtime
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold font-mono mb-2">
                                                {topUpAmount.toFixed(3)} SOL
                                            </div>
                                        </div>
                                        <Button className="w-full cursor-pointer" onClick={handleTopUp}>
                                            <Zap className="h-4 w-4 mr-2" />
                                            Confirm Top Up
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Used: {timeUsed.toFixed(6)} SOL</span>
                                <span>Total: {vm.price} SOL</span>
                            </div>
                            <Progress value={timeProgress} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                                ≈ {Math.floor(timeRemaining / 1000 / 60 / 1440)} days remaining at current rate
                            </div>
                        </div>
                    </>
                </CardContent>
            </Card>
        </motion.div>
    )
}