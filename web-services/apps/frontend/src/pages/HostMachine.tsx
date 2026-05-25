import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Step1 } from "@/components/DepinHosting/Step1";
import { Step2 } from "@/components/DepinHosting/Step2";
import { Step3 } from "@/components/DepinHosting/Step3";
import axios from "axios";
import { DEPIN_WORKER } from "@/config";
import { useNavigate, Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";

export function HostRegister() {
    const wallet = useWallet();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [id, setId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        machineType: "",
        ipAddress: "",
        cpu: 0,
        ram: 0,
        diskSize: 0,
        region: "",
        os: "",
        Key: "" 
    });
    const handleStep1Submit = async () => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${DEPIN_WORKER}/depin/register`, 
                {
                    ...formData,
                    userPublicKey: wallet.publicKey?.toBase58()
                },
                {
                    headers: {
                        "Authorization": `${localStorage.getItem("token")}`
                    },
                }
            );
            if (res.status === 200) {
                setId(res.data.vm.id);
                toast.success("Machine details saved successfully. Proceed to verification.");
                setCurrentStep(2);
            } 
        } catch (error) {
            console.error("Error saving machine details:", error);
            toast.error("Failed to save machine details. Please try again.");   
        }
        setIsLoading(false);
    };

    const handleStep2Verify = async () => {
        setIsLoading(true);
        try {
            if (!id) {
                toast.error("Machine ID is not set. Please complete step 1 first.");
                setIsLoading(false);
                return;
            }
            const res = await axios.get(`${DEPIN_WORKER}/depin/getById?id=${id}`, {
                headers: {
                    "Authorization": `${localStorage.getItem("token")}`
                },
            });
            if (res.data.verified) {
                toast.success("Machine verified! One final step remaining.");
                setCurrentStep(3);
            } else {
                toast.error("Please retry verification. Ensure the script was run correctly.");
            }
        } catch (error) {
            console.error("Error saving machine details:", error);
            toast.error("Failed to save machine details. Please try again.");   
        }
        setIsLoading(false);
    };
    
    const stepTitles = [
        { number: 1, title: "Machine Details" },
        { number: 2, title: "Machine Verification" },
        { number: 3, title: "Install this script to start accepting requests." }
    ];

    if (!wallet || !localStorage.getItem("token")) {
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex items-center justify-center">
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
              >
                  <h1 className="text-3xl font-bold mb-4">Please SignIn</h1>
                  <p className="text-muted-foreground mb-6">Please connect your wallet and ensure you are signed in to proceed.</p>
                  <Link to="/signin">
                      <Button className="cursor-pointer">SignIn</Button>
                  </Link>
              </motion.div>
          </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
            {/* Header Section */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                {currentStep === 1 && 
                    <Button variant="ghost" className="mb-4 cursor-pointer" onClick={() => navigate("/")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                }
                <div>
                    <div className="flex items-center justify-center space-x-8 mb-6">
                        {stepTitles.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center space-x-4"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                            currentStep === step.number 
                                ? 'bg-primary text-primary-foreground' 
                                : currentStep > step.number
                                ? 'bg-emerald-500 text-white'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                            {currentStep > step.number ? '✓' : step.number}
                            </div>
                            {index < stepTitles.length - 1 && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                        </motion.div>
                        ))}
                    </div>
                    
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">{stepTitles[currentStep - 1].title}</h2>
                    </div>
                </div>
            </motion.div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {currentStep === 1 && (
                        <Step1
                            formData={formData}
                            setFormData={setFormData}
                            isLoading={isLoading}
                            handleStep1Submit={handleStep1Submit}
                        />
                    )}

                    {currentStep === 2 && (
                        <Step2
                            handleStep2Verify={handleStep2Verify}
                            isLoading={isLoading}
                        />
                    )}

                    {currentStep === 3 && (
                        <Step3/>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
