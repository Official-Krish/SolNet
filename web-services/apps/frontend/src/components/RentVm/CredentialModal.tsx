import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { Terminal, Copy, Download } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { regions } from "@/lib/constants";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface CredentialModalProps {
    isCredentialsOpen: boolean;
    setIsCredentialsOpen: (open: boolean) => void;
    vmName: string;
    region: string;
    finalConfig?: {
        vmId: string;
        instanceId: string;
        ipAddress: string;
        privateKey: string;
        AuthToken: string;
    };
}

export const CredentialModal = ({ isCredentialsOpen, setIsCredentialsOpen, region, vmName, finalConfig }: CredentialModalProps ) => {
    const navigate = useNavigate();
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!", {
            position: "bottom-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
        });
    };
    return (
        <Dialog open={isCredentialsOpen} onOpenChange={setIsCredentialsOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center space-x-2">
                        <Terminal className="h-5 w-5 text-emerald-500" />
                        <span>VM Instance Deployed Successfully!</span>
                    </DialogTitle>
                    <DialogDescription>
                        Your virtual machine is now running. Save these credentials to access your instance.
                    </DialogDescription>
                </DialogHeader>
            
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {/* Instance Details */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                            <Label className="text-xs text-muted-foreground">Instance ID</Label>
                            <div className="font-mono text-sm">{finalConfig?.instanceId}</div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-sm">Running</span>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">IP Address</Label>
                            <div className="font-mono text-sm">{finalConfig?.ipAddress}</div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Region</Label>
                            <div className="text-sm">{regions.find(r => r.value === region)?.label}</div>
                        </div>
                    </div>

                    {/* SSH Access */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">SSH Access</CardTitle>
                            <CardDescription>Use these credentials to connect to your instance</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label>SSH Command</Label>
                                    <Button 
                                        variant="ghost" 
                                        className="cursor-pointer"
                                        size="sm"
                                        onClick={() => {
                                            copyToClipboard(`ssh -i ${vmName}-key.pem solnet@${finalConfig?.ipAddress}`)
                                        }}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="bg-black text-green-400 p-3 rounded font-mono text-sm">
                                    ssh -i ${vmName}-key.pem solnet@${finalConfig?.ipAddress}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label>Private Key</Label>
                                    <div className="flex space-x-2">
                                        <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => {
                                            const element = document.createElement("a");
                                            const file = new Blob([finalConfig?.privateKey || ""], { type: "text/plain" });
                                            element.href = URL.createObjectURL(file);
                                            element.download = `${vmName}-key.pem`;
                                            document.body.appendChild(element);
                                            element.click();
                                            document.body.removeChild(element);
                                        }}>
                                            <span className="sr-only">Download Private Key</span>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="bg-muted p-3 rounded font-mono text-xs">
                                    {finalConfig?.privateKey?.slice(0, 30)}<br/>
                                    <span className="text-muted-foreground">[Key truncated for security]</span><br/>
                                    -----END PRIVATE KEY-----
                                </div>

                                <div className="mt-4">
                                    <Label>Download Instructions</Label>
                                    <div className="text-xs text-muted-foreground mt-2">
                                        Click the download button to save your private key file.
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        After downloading, set the correct permissions and connect via SSH:
                                    </div>
                                    <div className="bg-muted p-1 rounded font-mono text-xs mt-1 flex justify-between items-center">
                                        <span className="font-mono">chmod 600 {vmName}-key.pem</span>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            className="cursor-pointer"
                                            onClick={() => copyToClipboard(`chmod 600 ${vmName}-key.pem`)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="bg-muted p-1 rounded font-mono text-xs mt-1 flex justify-between items-center">
                                        <span className="font-mono">ssh -i {vmName}-key.pem solnet@{finalConfig?.ipAddress}</span>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            className="cursor-pointer"
                                            onClick={() => copyToClipboard(`ssh -i ${vmName}-key.pem solnet@${finalConfig?.ipAddress}`)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-4">
                                    <Label>Auth Token (Required for Browser SSH)</Label>
                                    <Button 
                                        className="cursor-pointer"
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => copyToClipboard(finalConfig?.AuthToken || '')}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="bg-muted p-3 rounded font-mono text-xs">
                                    {finalConfig?.AuthToken.slice(0, 8)} ....... <br/>
                                    {finalConfig?.AuthToken.slice(-8)}<br/>
                                    <span className="text-muted-foreground">[Token truncated for security]</span>
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                <div className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                                    Security Notice
                                </div>
                                <div className="text-xs text-amber-600 dark:text-amber-400">
                                    Save your private key and auth token securely. This is the only time it will be displayed.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex-shrink-0 pt-4 border-t">
                    <div className="flex space-x-3">
                        <Button 
                            variant="outline" 
                            className="flex-1 cursor-pointer"
                            onClick={() => navigate(`/vm/${finalConfig?.vmId}`)}
                        >
                            View in Dashboard
                        </Button>
                        <Button 
                            className="flex-1 cursor-pointer"
                            onClick={() => navigate(`/dashboard`)}
                        >
                            Got it, thanks!
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}