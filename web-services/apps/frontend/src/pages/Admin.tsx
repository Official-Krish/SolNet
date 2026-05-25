import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import type { VM } from 'types/vm';
import { FundVaultAccount, GetVaultBalance, InitiatesVaultAccount, WithdrawFromVault } from '@/lib/contract';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { ADMIN_KEY, BACKEND_URL } from '@/config';
import { formatter } from '@/lib/FormatTime';

interface VaultOperation {
  secretKey: string;
  amount?: string;
  address?: string;
}

export function AdminPage() {
    const wallet = useAnchorWallet();
    const [activeTab, setActiveTab] = useState('vault');
    const [isLoading, setIsLoading] = useState(false);
    const [vaultBalance, setVaultBalance] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form states
    const [initVault, setInitVault] = useState<VaultOperation>({ secretKey: '' });
    const [fundVault, setFundVault] = useState<VaultOperation>({ secretKey: '', amount: '' });
    const [withdrawVault, setWithdrawVault] = useState<VaultOperation>({ secretKey: '', amount: '', address: '' });
    const [balanceCheck, setBalanceCheck] = useState<VaultOperation>({ secretKey: '' });
    const [vms, setVMs] = useState<VM[]>([]);
    
    // Calculate pagination values
    const totalItems = vms.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedVMs = vms.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        const fetchVMs = async () => {
            try {
                if(activeTab !== 'vms') return; 
                const res = await axios.get(`${BACKEND_URL}/vm/getAll?adminKey=${wallet?.publicKey}`, {
                    headers: {
                        Authorization: `${localStorage.getItem('token')}`
                    }
                })
                if (res.status === 200) {
                    setVMs(res.data || []);
                } else {
                    toast.error('Failed to fetch virtual machines');
                }
            } catch (error) {
                console.error('Failed to fetch VMs:', error);
                toast.error('Failed to load virtual machines');
            }
        };

        fetchVMs();
    }, [activeTab]);

    const handleVaultOperation = async (operation: string, data: VaultOperation) => {
        if (!data.secretKey.trim()) {
            toast.error('Secret key is required');
            return;
        }

        setIsLoading(true);
        
        try {        
            switch (operation) {
                case 'init':
                    const res = await InitiatesVaultAccount(wallet! ,data.secretKey)
                    if (!res?.success) {
                        toast.error('Failed to initialize vault account');
                        return;
                    }
                    toast.success('Vault account initiated successfully');
                    setVaultBalance(0);
                    break;
                case 'fund':
                    if (!data.amount || parseFloat(data.amount) <= 0) {
                        toast.error('Valid amount is required');
                        return;
                    }
                    const resp = await FundVaultAccount(wallet!, parseFloat(data.amount), data.secretKey);
                    if (!resp?.success) {
                        toast.error('Failed to fund vault account');
                        return;
                    }
                    toast.success(`Vault funded with ${data.amount} SOL`);
                    break;
                case 'withdraw':
                    if (!data.amount || !data.address) {
                        toast.error('Amount and address are required');
                        return;
                    }
                    const withdrawAmount = parseFloat(data.amount);
                    if (vaultBalance !== null && withdrawAmount > vaultBalance) {
                        toast.error('Insufficient vault balance');
                        return;
                    }
                    const respo = await WithdrawFromVault(withdrawAmount, wallet!, data.secretKey);
                    if (!respo?.success) {
                        toast.error('Failed to withdraw from vault');
                        return;
                    }

                    toast.success(`${withdrawAmount} SOL withdrawn to ${data.address.slice(0, 8)}...`);
                    break;
                case 'balance':
                    const balance = await GetVaultBalance(wallet!, data.secretKey);
                    if (balance === null) {
                        toast.error('Failed to fetch vault balance');
                        return;
                    }
                    setVaultBalance(balance.balance);
                    toast.success(`Current vault balance: ${balance.balance} SOL`);
                    break;
            }
        } catch (error) {
          toast.error('Operation failed. Please try again.');
        } finally {
          setIsLoading(false);
        }
    };

    const getStatusBadge = (status: VM['status']) => {
        const variants = {
            RUNNING: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-500' },
            BOOTING: { variant: 'secondary' as const, icon: Clock, color: 'text-gray-500' },
            TERMINATING: { variant: 'outline' as const, icon: Clock, color: 'text-yellow-500' },
            DELETED: { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-500' }
        };
        
        const config = variants[status];
        const Icon = config.icon;
        
        return (
        <Badge variant={config.variant} className="gap-1">
            <Icon className={`w-3 h-3 ${config.color}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
        );
    };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  if (!wallet || wallet.publicKey.toBase58() !== ADMIN_KEY || !localStorage.getItem('token')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertDescription>
            Please connect your wallet to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-6 mt-20">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-48 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-64 bg-gradient-to-br from-secondary/5 to-muted/5 rounded-3xl blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage vault operations and monitor VMs</p>
            </div>
          </div>
        </motion.div>

        {/* Vault Balance Display */}
        {vaultBalance !== null && (
          <motion.div variants={itemVariants} className="mb-6">
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <Wallet className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Current Vault Balance: {vaultBalance.toFixed(4)} SOL</strong>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
              <TabsTrigger value="vault" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Vault Management
              </TabsTrigger>
              <TabsTrigger value="vms" className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                VM Monitoring
              </TabsTrigger>
            </TabsList>

            {/* Vault Management Tab */}
            <TabsContent value="vault" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Initialize Vault */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-blue-500" />
                      Initialize Vault
                    </CardTitle>
                    <CardDescription>
                      Create a new vault account with your secret key
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="init-secret">Secret Key</Label>
                      <Input
                        id="init-secret"
                        type="password"
                        placeholder="Enter your secret key"
                        value={initVault.secretKey}
                        onChange={(e) => setInitVault({ ...initVault, secretKey: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={() => handleVaultOperation('init', initVault)}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Initializing...' : 'Initialize Vault'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Fund Vault */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowUpCircle className="w-5 h-5 text-green-500" />
                      Fund Vault
                    </CardTitle>
                    <CardDescription>
                      Add funds to your vault account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fund-secret">Secret Key</Label>
                      <Input
                        id="fund-secret"
                        type="password"
                        placeholder="Enter your secret key"
                        value={fundVault.secretKey}
                        onChange={(e) => setFundVault({ ...fundVault, secretKey: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fund-amount">Amount (SOL)</Label>
                      <Input
                        id="fund-amount"
                        type="number"
                        step="0.0001"
                        placeholder="0.0000"
                        value={fundVault.amount}
                        onChange={(e) => setFundVault({ ...fundVault, amount: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={() => handleVaultOperation('fund', fundVault)}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Funding...' : 'Fund Vault'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Withdraw Funds */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowDownCircle className="w-5 h-5 text-red-500" />
                      Withdraw Funds
                    </CardTitle>
                    <CardDescription>
                      Withdraw funds from your vault to an address
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-secret">Secret Key</Label>
                      <Input
                        id="withdraw-secret"
                        type="password"
                        placeholder="Enter your secret key"
                        value={withdrawVault.secretKey}
                        onChange={(e) => setWithdrawVault({ ...withdrawVault, secretKey: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount">Amount (SOL)</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        step="0.0001"
                        placeholder="0.0000"
                        value={withdrawVault.amount}
                        onChange={(e) => setWithdrawVault({ ...withdrawVault, amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-address">Destination Address</Label>
                      <Input
                        id="withdraw-address"
                        placeholder="Enter Solana address"
                        value={withdrawVault.address}
                        onChange={(e) => setWithdrawVault({ ...withdrawVault, address: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={() => handleVaultOperation('withdraw', withdrawVault)}
                      disabled={isLoading}
                      variant="destructive"
                      className="w-full"
                    >
                      {isLoading ? 'Withdrawing...' : 'Withdraw Funds'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Check Balance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-purple-500" />
                      Check Balance
                    </CardTitle>
                    <CardDescription>
                      View your current vault balance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="balance-secret">Secret Key</Label>
                      <Input
                        id="balance-secret"
                        type="password"
                        placeholder="Enter your secret key"
                        value={balanceCheck.secretKey}
                        onChange={(e) => setBalanceCheck({ ...balanceCheck, secretKey: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={() => handleVaultOperation('balance', balanceCheck)}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full"
                    >
                      {isLoading ? 'Checking...' : 'Check Balance'}
                    </Button>

                    {vaultBalance !== null && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        Current Vault Balance: <strong>{Number(vaultBalance)} SOL</strong>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* VM Monitoring Tab */}
            <TabsContent value="vms" className="space-y-6">
              {vms.length === 0 ? (
                <Alert className="mb-4">
                  <AlertDescription>
                    No virtual machines found.
                  </AlertDescription>
                </Alert>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      Virtual Machines ({vms.length} total)
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
                                <TableCell className="font-mono text-sm">{vm.instanceId}</TableCell>
                                <TableCell className="font-medium">{vm.name}</TableCell>
                                <TableCell>{getStatusBadge(vm.status)}</TableCell>
                                <TableCell>{vm.VMConfig.machineType}</TableCell>
                                <TableCell>{vm.region}</TableCell>
                                <TableCell className="text-sm">
                                  <div>{vm.VMConfig.os}</div>
                                  <div className="text-muted-foreground">{vm.VMConfig.diskSize} GB</div>
                                </TableCell>
                                <TableCell className="text-sm">{vm.ipAddress}</TableCell>
                                <TableCell className="font-medium">{(Number(vm.price)).toFixed(6)} SOL</TableCell>
                                <TableCell className="text-sm">
                                    {
                                    vm.endTime ? 
                                      `${Math.floor((new Date(vm.endTime).getTime() - new Date(vm.createdAt).getTime()) / (1000 * 60))} minutes`
                                    : 
                                      'N/A'
                                    }

                                </TableCell>
                                <TableCell className="text-sm">{formatter.format(new Date(vm.createdAt))}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-muted-foreground">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} VMs
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="w-4 h-4" />
                              Previous
                            </Button>
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1;
                                return (
                                  <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {page}
                                  </Button>
                                );
                              })}
                              {totalPages > 5 && (
                                <>
                                  <span className="text-muted-foreground">...</span>
                                  <Button
                                    variant={currentPage === totalPages ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(totalPages)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {totalPages}
                                  </Button>
                                </>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Next
                              <ChevronRight className="w-4 h-4" />
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
      </motion.div>
    </div>
  );
}