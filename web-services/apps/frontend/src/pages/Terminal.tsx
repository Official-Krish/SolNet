import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Terminal as TerminalIcon, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useTheme } from '@/components/themeProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import 'xterm/css/xterm.css';
import { WS_RELAYER_URL } from '@/config';

const SSHTerminal = () => {
    const wallet = useWallet(); 
    const navigate = useNavigate();
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState('');
    const [vmHost, setVmHost] = useState('');
    const [error, setError] = useState('');
    const { theme } = useTheme();
    
    const terminalRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    let [historyIndex, setHistoryIndex] = useState(-1);
    let [cursorPosition, setCursorPosition] = useState(0);

    const initializeTerminal = useCallback(() => {
        if (!terminalRef.current || xtermRef.current) return;
        
        const isDark = theme === 'dark' || 
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        try {
            const terminal = new Terminal({
                cursorBlink: true,
                fontSize: 14,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                theme: {
                    background: isDark ? 'hsl(var(--background))' : '#ffffff',
                    foreground: isDark ? 'hsl(var(--foreground))' : '#000000',
                    cursor: isDark ? 'hsl(var(--primary))' : '#000000',
                },
                rows: 24,
                cols: 80,
            });

            const fitAddon = new FitAddon();
            terminal.loadAddon(fitAddon);
            
            terminal.open(terminalRef.current);
            fitAddon.fit();

            xtermRef.current = terminal;
            fitAddonRef.current = fitAddon;

            terminal.write('SSH Terminal Ready\r\n');
            terminal.write('Press enter/return to start the terminal...\r\n');
            
            let commandBuffer = '';
            terminal.onData((data) => {
                if (data === '\x1b[A') { // Up arrow - previous command
                    if (commandHistory.length > 0) {
                        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
                        setHistoryIndex(newIndex);
                        const historicalCommand = commandHistory[newIndex];
                        
                        // Clear current line
                        terminal.write('\r\x1b[K');
                        terminal.write('solnet@test2:~$ ');
                        
                        // Write historical command
                        terminal.write(historicalCommand);
                        
                        // Update state
                        commandBuffer = historicalCommand;
                        setCursorPosition(historicalCommand.length);
                        setHistoryIndex(newIndex);
                    }
                    return;
                } else if (data === '\x1b[B') { // Down arrow - next command
                    if (commandHistory.length > 0) {
                        const newIndex = historyIndex === -1 ? -1 : Math.min(commandHistory.length - 1, historyIndex + 1);
                        
                        // Clear current line
                        terminal.write('\r\x1b[K');
                        terminal.write('solnet@test2:~$ ');
                        
                        if (newIndex === -1 || newIndex === commandHistory.length) {
                            // No more history, clear command
                            commandBuffer = '';
                            setCursorPosition(0);
                            setHistoryIndex(-1);
                        } else {
                            const historicalCommand = commandHistory[newIndex];
                            terminal.write(historicalCommand);
                            commandBuffer = historicalCommand;
                            setCursorPosition(historicalCommand.length);
                            setHistoryIndex(newIndex);
                        }
                    }
                    return;
                } else if (data === '\x1b[C') { // Right arrow - move cursor right
                    if (cursorPosition < commandBuffer.length) {
                        terminal.write('\x1b[C');
                        setCursorPosition(cursorPosition + 1);
                    }
                    return;
                } else if (data === '\x1b[D') { // Left arrow - move cursor left
                    if (cursorPosition > 0) {
                        terminal.write('\x1b[D');
                        setCursorPosition(cursorPosition - 1);
                    }
                    return;
                }
                if (data === '\r' || data === '\n') { // Enter key
                    if (wsRef.current?.readyState === WebSocket.OPEN && isConnected) {
                        wsRef.current.send(JSON.stringify({
                            type: 'command',
                            command: commandBuffer,
                        }));
                        if (commandBuffer.trim()) {
                            setCommandHistory((prevHistory) => [...prevHistory, commandBuffer.trim()]);
                        }
                        setHistoryIndex(-1);
                        commandBuffer = '';
                        terminal.write('\r\n');
                    }
                } else if (data === '\x7f') { // Backspace
                    if (commandBuffer.length > 0) {
                        commandBuffer = commandBuffer.slice(0, -1);
                        terminal.write('\b \b');
                    }
                } else {
                    commandBuffer += data;
                    terminal.write(data);
                }
            });

        } catch (err) {
            console.error('Terminal initialization error:', err);
        }
    }, [theme, isConnected]);

    // Initialize terminal when authenticated and connected
    useEffect(() => {
        if (isAuthenticated && isConnected && terminalRef.current && !xtermRef.current) {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                initializeTerminal();
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, isConnected, initializeTerminal]);

    // Handle window resize
    useEffect(() => {
        const resizeHandler = () => {
            if (fitAddonRef.current && xtermRef.current) {
                try {
                    fitAddonRef.current.fit();
                } catch (err) {
                    console.error('Resize error:', err);
                }
            }
        };

        window.addEventListener('resize', resizeHandler);

        return () => {
            window.removeEventListener('resize', resizeHandler);
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (xtermRef.current) {
                try {
                    xtermRef.current.dispose();
                } catch (err) {
                    console.error('Terminal dispose error:', err);
                }
                xtermRef.current = null;
                fitAddonRef.current = null;
            }
        };
    }, []);

    const connect = useCallback(() => {
        if (!token.trim()) {
            setError('Please enter a token');
            return;
        }

        setError('');
        
        const ws = new WebSocket(WS_RELAYER_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: 'authenticate',
                token: token
            }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'authenticated':
                        setIsAuthenticated(true);
                        setVmHost(data.allowedVMs); 
                        ws.send(JSON.stringify({
                            type: 'connect',
                            config: {
                                host: data.allowedVMs,
                                username: "solnet",
                                port: 22
                            }
                        }));
                        break;
                    
                    case 'status':
                        if (data.message === 'SSH connected') {
                            setIsConnected(true);
                        }
                        break;
                    
                    case 'output':
                        if (xtermRef.current) {
                            xtermRef.current.write(data.data);
                        }
                        break;
                    
                    case 'error':
                        setError(data.message);
                        break;
                }
            } catch (err) {
                console.error('Message processing error:', err);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            setIsAuthenticated(false);
            setError('Connection closed');
        };

        ws.onerror = (err) => {
            setError('Connection failed');
            console.error('WebSocket error:', err);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [token]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        setIsConnected(false);
        setIsAuthenticated(false);
        
        // Clean up terminal
        if (xtermRef.current) {
            try {
                xtermRef.current.dispose();
            } catch (err) {
                console.error('Terminal dispose error:', err);
            }
            xtermRef.current = null;
            fitAddonRef.current = null;
        }
        window.close();
    }, []);

    if (!wallet.connected || !localStorage.getItem("token")) {
        navigate('/signin');
        return null;
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-4">
                            <TerminalIcon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">SSH Terminal</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="space-y-2">
                            <Label htmlFor="token">Access Token</Label>
                            <Input
                                id="token"
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Enter your access token"
                                onKeyUp={(e) => e.key === 'Enter' && connect()}
                            />
                        </div>
                    
                        <Button
                            onClick={connect}
                            disabled={!token.trim()}
                            className="w-full cursor-pointer"
                        >
                            Connect
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isAuthenticated && isConnected) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                {/* Header */}
                <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <TerminalIcon className="h-5 w-5 text-primary" />
                            <h1 className="text-lg font-medium">SSH Terminal</h1>
                        </div>
                        <span className="text-sm text-muted-foreground">{vmHost}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
                            {isConnected ? (
                                <>
                                    <Wifi className="h-3 w-3" />
                                    Connected
                                </>
                            ) : (
                                <>
                                    <WifiOff className="h-3 w-3" />
                                    Connecting...
                                </>
                            )}
                        </Badge>
                        
                        <Button
                            onClick={disconnect}
                            variant="destructive"
                            size="sm"
                            className='cursor-pointer'
                            disabled={!isConnected}
                        >
                            Disconnect
                        </Button>
                    </div>
                </div>
    
                {/* Terminal */}
                <div className="flex-1 p-4">
                    <div 
                        ref={terminalRef}
                        className="w-full h-[600px] bg-card rounded-lg shadow-sm"
                        style={{ minHeight: '600px' }}
                    />
                </div>

            </div>
        );
    }

    // Loading state while connecting
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Connecting to VM...</p>
            </div>
        </div>
    );
};

export default SSHTerminal;