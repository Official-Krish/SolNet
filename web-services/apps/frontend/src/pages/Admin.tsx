import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Wallet,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  Server,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { VM } from "types/vm";
import {
  FundVaultAccount,
  GetVaultBalance,
  InitiatesVaultAccount,
  WithdrawFromVault,
} from "@/lib/contract";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import axios from "axios";
import { ADMIN_KEY, BACKEND_URL } from "@/config";
import { formatter } from "@/lib/FormatTime";
import { useIndexerEvents, type IndexerEvent } from "@/lib/useIndexerEvents";
import { clusterApiUrl, Connection } from "@solana/web3.js";

/* ── per-operation tx status ──────────────────────────────────────── */
type TxStatus = "idle" | "submitted" | "confirmed" | "failed";

interface OpState {
  status: TxStatus;
  signature?: string;
  message?: string;
}

const IDLE: OpState = { status: "idle" };

/* ── vault instructions the indexer emits ─────────────────────────── */
const VAULT_INSTRUCTIONS = new Set([
  "initialize_vault",
  "fund_vault",
  "withdraw_funds",
  "transfer_from_vault",
  "transfer_to_vault_and_rent",
  "end_rental_session",
]);

/* ── inline status banner ─────────────────────────────────────────── */
function TxBanner({ op }: { op: OpState }) {
  if (op.status === "idle") return null;

  const cfg = {
    submitted: {
      icon: <Loader2 className="w-4 h-4 animate-spin text-amber-500" />,
      cls: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20",
      text: "text-amber-800 dark:text-amber-200",
    },
    confirmed: {
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      cls: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20",
      text: "text-green-800 dark:text-green-200",
    },
    failed: {
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      cls: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20",
      text: "text-red-800 dark:text-red-200",
    },
  }[op.status];

  return (
    <Alert className={`mt-3 ${cfg.cls}`}>
      <div className="flex items-start gap-2">
        {cfg.icon}
        <AlertDescription className={`text-xs ${cfg.text}`}>
          <span>{op.message}</span>
          {op.signature && (
            <span className="block font-mono mt-0.5 opacity-60 truncate">
              {op.signature.slice(0, 20)}…
            </span>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
}

interface VaultOperation {
  secretKey: string;
  amount?: string;
  address?: string;
}

export function AdminPage() {
  const wallet = useAnchorWallet();
  const [activeTab, setActiveTab] = useState("vault");
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Per-operation states
  const [initOp, setInitOp] = useState<OpState>(IDLE);
  const [fundOp, setFundOp] = useState<OpState>(IDLE);
  const [withdrawOp, setWithdrawOp] = useState<OpState>(IDLE);
  const [balanceOp, setBalanceOp] = useState<OpState>(IDLE);

  // Form states
  const [initVault, setInitVault] = useState<VaultOperation>({ secretKey: "" });
  const [fundVault, setFundVault] = useState<VaultOperation>({
    secretKey: "",
    amount: "",
  });
  const [withdrawVault, setWithdrawVault] = useState<VaultOperation>({
    secretKey: "",
    amount: "",
    address: "",
  });
  const [balanceCheck, setBalanceCheck] = useState<VaultOperation>({
    secretKey: "",
  });
  const [vms, setVMs] = useState<VM[]>([]);

  // Track pending signatures → which op they belong to
  const pendingSigs = useRef<Map<string, (event: IndexerEvent) => void>>(
    new Map(),
  );

  // Fallback timeout refs per op
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const totalItems = vms.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVMs = vms.slice(startIndex, startIndex + itemsPerPage);

  // ── Subscribe to indexer events for admin's pubkey ──────────────
  const adminPubkey = wallet?.publicKey?.toBase58();
  useIndexerEvents({
    account: adminPubkey,
    onEvent: (event) => {
      if (!VAULT_INSTRUCTIONS.has(event.instruction)) return;

      // Find the pending op that matches this signature
      const handler = pendingSigs.current.get(event.signature);
      if (handler) {
        handler(event);
        pendingSigs.current.delete(event.signature);
        // Clear fallback timeout
        const t = timeouts.current.get(event.signature);
        if (t) {
          clearTimeout(t);
          timeouts.current.delete(event.signature);
        }
      }
    },
  });

  useEffect(() => {
    if (activeTab !== "vms") return;
    axios
      .get(`${BACKEND_URL}/vm/getAll?adminKey=${wallet?.publicKey}`, {
        headers: { Authorization: `${localStorage.getItem("token")}` },
      })
      .then((res) => {
        if (res.status === 200) setVMs(res.data || []);
      })
      .catch(() => toast.error("Failed to load virtual machines"));
  }, [activeTab, wallet?.publicKey]);

  // ── Helper: submit tx, show "submitted", wait for indexer event ──
  function watchTx(
    signature: string,
    setOp: (s: OpState) => void,
    confirmedMsg: string,
    onConfirmed?: () => void,
  ) {
    setOp({
      status: "submitted",
      signature,
      message: "Transaction submitted — waiting for on-chain confirmation…",
    });

    const resolve = (event: IndexerEvent) => {
      clearFallback();
      if (event.success) {
        setOp({ status: "confirmed", signature, message: confirmedMsg });
        toast.success(confirmedMsg);
        onConfirmed?.();
      } else {
        setOp({
          status: "failed",
          signature,
          message: "Transaction failed on-chain.",
        });
        toast.error("Transaction failed on-chain.");
      }
    };

    pendingSigs.current.set(signature, resolve);

    // Poll RPC directly every 2s for up to 30s — don't rely solely on indexer
    let elapsed = 0;
    const poll = setInterval(async () => {
      elapsed += 2000;
      try {
        const conn = new Connection(clusterApiUrl("devnet"));
        const status = await conn.getSignatureStatus(signature, {
          searchTransactionHistory: true,
        });
        const conf = status?.value?.confirmationStatus;
        if (conf === "confirmed" || conf === "finalized") {
          clearInterval(poll);
          if (pendingSigs.current.has(signature)) {
            pendingSigs.current.delete(signature);
            setOp({ status: "confirmed", signature, message: confirmedMsg });
            toast.success(confirmedMsg);
            onConfirmed?.();
          }
        }
      } catch {
        /* ignore */
      }
      if (elapsed >= 30000) {
        clearInterval(poll);
        if (pendingSigs.current.has(signature)) {
          pendingSigs.current.delete(signature);
          setOp({
            status: "failed",
            signature,
            message: "Confirmation timed out.",
          });
          toast.error("Confirmation timed out.");
        }
      }
    }, 2000);

    const clearFallback = () => clearInterval(poll);
    timeouts.current.set(
      signature,
      poll as unknown as ReturnType<typeof setTimeout>,
    );
  }

  // ── Vault operations ─────────────────────────────────────────────
  const handleInit = async () => {
    if (!initVault.secretKey.trim()) {
      toast.error("Secret key is required");
      return;
    }
    setInitOp({ status: "submitted", message: "Signing transaction…" });
    const res = await InitiatesVaultAccount(wallet!, initVault.secretKey);
    if (!res?.success || !res.signature) {
      setInitOp({ status: "failed", message: "Failed to initialize vault." });
      toast.error("Failed to initialize vault");
      return;
    }
    watchTx(res.signature, setInitOp, "Vault initialized successfully", () =>
      setVaultBalance(0),
    );
  };

  const handleFund = async () => {
    if (!fundVault.secretKey.trim()) {
      toast.error("Secret key is required");
      return;
    }
    if (!fundVault.amount || parseFloat(fundVault.amount) <= 0) {
      toast.error("Valid amount required");
      return;
    }
    setFundOp({ status: "submitted", message: "Signing transaction…" });
    const res = await FundVaultAccount(
      wallet!,
      parseFloat(fundVault.amount),
      fundVault.secretKey,
    );
    if (!res?.success || !res.signature) {
      setFundOp({ status: "failed", message: "Failed to fund vault." });
      toast.error("Failed to fund vault");
      return;
    }
    watchTx(
      res.signature,
      setFundOp,
      `Vault funded: ${fundVault.amount} SOL confirmed`,
      () => {
        if (res.balance !== undefined) setVaultBalance(res.balance);
      },
    );
  };

  const handleWithdraw = async () => {
    if (
      !withdrawVault.secretKey.trim() ||
      !withdrawVault.amount ||
      !withdrawVault.address
    ) {
      toast.error("All fields are required");
      return;
    }
    const amt = parseFloat(withdrawVault.amount);
    if (vaultBalance !== null && amt > vaultBalance) {
      toast.error("Insufficient vault balance");
      return;
    }
    setWithdrawOp({ status: "submitted", message: "Signing transaction…" });
    const res = await WithdrawFromVault(amt, wallet!, withdrawVault.secretKey);
    if (!res?.success || !res.signature) {
      setWithdrawOp({ status: "failed", message: "Failed to withdraw." });
      toast.error("Failed to withdraw");
      return;
    }
    watchTx(res.signature, setWithdrawOp, `${amt} SOL withdrawn — confirmed`);
  };

  const handleBalance = async () => {
    if (!balanceCheck.secretKey.trim()) {
      toast.error("Secret key is required");
      return;
    }
    setBalanceOp({ status: "submitted", message: "Fetching balance…" });
    const res = await GetVaultBalance(wallet!, balanceCheck.secretKey);
    if (!res) {
      setBalanceOp({ status: "failed", message: "Failed to fetch balance." });
      toast.error("Failed to fetch balance");
      return;
    }
    setVaultBalance(res.balance);
    setBalanceOp({
      status: "confirmed",
      message: `Vault balance: ${res.balance.toFixed(4)} SOL`,
    });
  };

  const getStatusBadge = (status: VM["status"]) => {
    const variants = {
      RUNNING: {
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-green-500",
      },
      BOOTING: {
        variant: "secondary" as const,
        icon: Clock,
        color: "text-gray-500",
      },
      TERMINATING: {
        variant: "outline" as const,
        icon: Clock,
        color: "text-yellow-500",
      },
      DELETED: {
        variant: "destructive" as const,
        icon: AlertCircle,
        color: "text-red-500",
      },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`w-3 h-3 ${config.color}`} />
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </Badge>
    );
  };

  if (
    !wallet ||
    wallet.publicKey.toBase58() !== ADMIN_KEY ||
    !localStorage.getItem("token")
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertDescription>
            Please connect your admin wallet to access this dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const busy = (op: OpState) => op.status === "submitted";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-6 mt-20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-48 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-64 bg-gradient-to-br from-secondary/5 to-muted/5 rounded-3xl blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage vault operations and monitor VMs
            </p>
          </div>
          {/* Live indexer indicator */}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Indexer live
          </div>
        </div>

        {/* Vault balance banner */}
        {vaultBalance !== null && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
            <Wallet className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>
                Current Vault Balance: {vaultBalance.toFixed(4)} SOL
              </strong>
            </AlertDescription>
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="vault" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Vault Management
            </TabsTrigger>
            <TabsTrigger value="vms" className="flex items-center gap-2">
              <Server className="w-4 h-4" /> VM Monitoring
            </TabsTrigger>
          </TabsList>

          {/* ── Vault tab ─────────────────────────────────────────── */}
          <TabsContent value="vault" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Initialize Vault */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-500" /> Initialize Vault
                  </CardTitle>
                  <CardDescription>
                    Create a new vault account with your secret key
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter your secret key"
                      value={initVault.secretKey}
                      onChange={(e) =>
                        setInitVault({
                          ...initVault,
                          secretKey: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    onClick={handleInit}
                    disabled={busy(initOp)}
                    className="w-full"
                  >
                    {busy(initOp) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Initializing…
                      </>
                    ) : (
                      "Initialize Vault"
                    )}
                  </Button>
                  <TxBanner op={initOp} />
                </CardContent>
              </Card>

              {/* Fund Vault */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5 text-green-500" /> Fund
                    Vault
                  </CardTitle>
                  <CardDescription>
                    Add funds to your vault account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter your secret key"
                      value={fundVault.secretKey}
                      onChange={(e) =>
                        setFundVault({
                          ...fundVault,
                          secretKey: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (SOL)</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={fundVault.amount}
                      onChange={(e) =>
                        setFundVault({ ...fundVault, amount: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    onClick={handleFund}
                    disabled={busy(fundOp)}
                    className="w-full"
                  >
                    {busy(fundOp) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Funding…
                      </>
                    ) : (
                      "Fund Vault"
                    )}
                  </Button>
                  <TxBanner op={fundOp} />
                </CardContent>
              </Card>

              {/* Withdraw Funds */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowDownCircle className="w-5 h-5 text-red-500" />{" "}
                    Withdraw Funds
                  </CardTitle>
                  <CardDescription>
                    Withdraw funds from your vault to an address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter your secret key"
                      value={withdrawVault.secretKey}
                      onChange={(e) =>
                        setWithdrawVault({
                          ...withdrawVault,
                          secretKey: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (SOL)</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={withdrawVault.amount}
                      onChange={(e) =>
                        setWithdrawVault({
                          ...withdrawVault,
                          amount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Destination Address</Label>
                    <Input
                      placeholder="Enter Solana address"
                      value={withdrawVault.address}
                      onChange={(e) =>
                        setWithdrawVault({
                          ...withdrawVault,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    onClick={handleWithdraw}
                    disabled={busy(withdrawOp)}
                    variant="destructive"
                    className="w-full"
                  >
                    {busy(withdrawOp) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Withdrawing…
                      </>
                    ) : (
                      "Withdraw Funds"
                    )}
                  </Button>
                  <TxBanner op={withdrawOp} />
                </CardContent>
              </Card>

              {/* Check Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-500" /> Check Balance
                  </CardTitle>
                  <CardDescription>
                    View your current vault balance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter your secret key"
                      value={balanceCheck.secretKey}
                      onChange={(e) =>
                        setBalanceCheck({
                          ...balanceCheck,
                          secretKey: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    onClick={handleBalance}
                    disabled={busy(balanceOp)}
                    variant="outline"
                    className="w-full"
                  >
                    {busy(balanceOp) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking…
                      </>
                    ) : (
                      "Check Balance"
                    )}
                  </Button>
                  <TxBanner op={balanceOp} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── VM tab ────────────────────────────────────────────── */}
          <TabsContent value="vms" className="space-y-6">
            {vms.length === 0 ? (
              <Alert>
                <AlertDescription>No virtual machines found.</AlertDescription>
              </Alert>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" /> Virtual Machines (
                    {vms.length} total)
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage all deployed virtual machines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>VM ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead>Resources</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedVMs.map((vm) => (
                          <TableRow key={vm.id}>
                            <TableCell className="font-mono text-sm">
                              {vm.instanceId}
                            </TableCell>
                            <TableCell className="font-medium">
                              {vm.name}
                            </TableCell>
                            <TableCell>{getStatusBadge(vm.status)}</TableCell>
                            <TableCell>{vm.VMConfig.machineType}</TableCell>
                            <TableCell>{vm.region}</TableCell>
                            <TableCell className="text-sm">
                              <div>{vm.VMConfig.os}</div>
                              <div className="text-muted-foreground">
                                {vm.VMConfig.diskSize} GB
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {vm.ipAddress}
                            </TableCell>
                            <TableCell className="font-medium">
                              {Number(vm.price).toFixed(6)} SOL
                            </TableCell>
                            <TableCell className="text-sm">
                              {vm.endTime
                                ? `${Math.floor((new Date(vm.endTime).getTime() - new Date(vm.createdAt).getTime()) / 60000)} min`
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatter.format(new Date(vm.createdAt))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}–
                        {Math.min(startIndex + itemsPerPage, totalItems)} of{" "}
                        {totalItems} VMs
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" /> Previous
                        </Button>
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => i + 1,
                        ).map((page) => (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                        {totalPages > 5 && (
                          <>
                            <span className="text-muted-foreground">…</span>
                            <Button
                              variant={
                                currentPage === totalPages
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(totalPages)}
                              className="w-8 h-8 p-0"
                            >
                              {totalPages}
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
