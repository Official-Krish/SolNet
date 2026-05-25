import type { ServerWebSocket } from "bun";
import { Client as SSHClient } from "ssh2";
import { type JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";

interface Session {
    userId: string;
    allowedVM: string;
    privateKey: string;
    expiresAt: number;
}

interface Connection {
    ssh: SSHClient;
    stream: import("ssh2").ClientChannel;
}

const connections = new Map<ServerWebSocket, Connection>();
const userSessions = new WeakMap<ServerWebSocket, Session>();

type incomingMessage = {
    type: 'authenticate' | 'connect' | 'command' | 'disconnect';
    token?: string;
    config?: {
        host: string;
        port?: number;
        username: string;
    };
    command?: string;
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

Bun.serve({
    fetch(req, server) {
        if (server.upgrade(req)) {
            return;
        }
        return new Response("Upgrade failed", { status: 500 });
    },
    websocket: {
        message(ws, message) {
            try {
                const data: incomingMessage = JSON.parse(message.toString());

                if (data.type === 'authenticate') {
                    authenticateUser(ws as ServerWebSocket<undefined>, data.token!);
                } else if (data.type === 'connect') {
                    connectToVM(ws as ServerWebSocket<undefined>, data.config!);
                } else if (data.type === 'command') {
                    sendCommand(ws as ServerWebSocket<undefined>, data.command!);
                } else if (data.type === 'disconnect') {
                    disconnectFromVM(ws as ServerWebSocket<undefined>);
                }
            } catch (err) {
                console.error("Error processing WebSocket message:", err);
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
            }
        },
        open(ws) {
            ws.send(JSON.stringify({
                type: 'status',
                message: 'Connected to WebSocket. Please authenticate.'
            }));
        },
        close(ws) {
            disconnectFromVM(ws as ServerWebSocket<undefined>);
        },
    },
    port: 9093
});

function authenticateUser(ws: ServerWebSocket<undefined>, token: string) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        if (!decoded || !decoded.userId || !decoded.privateKey || !decoded.exp || !decoded.allowedVms) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
            return;
        }
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            ws.send(JSON.stringify({ type: 'error', message: 'Token expired' }));
            return;
        }
        userSessions.set(ws, {
            userId: decoded.userId,
            allowedVM: decoded.allowedVms,
            privateKey: decoded.privateKey,
            expiresAt: decoded.exp * 1000
        });

        ws.send(JSON.stringify({
            type: 'authenticated',
            message: 'Authentication successful',
            allowedVMs: decoded.allowedVms
        }));

    } catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
    }
}

function isAuthenticated(ws: ServerWebSocket<undefined>): boolean {
    const session = userSessions.get(ws);
    if (!session) return false;

    if (session.expiresAt && session.expiresAt < Date.now()) {
        userSessions.delete(ws);
        return false;
    }

    return true;
}

function canAccessVM(ws: ServerWebSocket<undefined>, vmHost: string): boolean {
    const session = userSessions.get(ws);
    if (!session) return false;

    return session.allowedVM.includes(vmHost) || session.allowedVM.includes('*');
}

function connectToVM(ws: ServerWebSocket<undefined>, config: {
    host: string;
    port?: number;
    username: string;
}) {
    if (!isAuthenticated(ws)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
        return;
    }

    if (!canAccessVM(ws, config.host)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Access denied to this VM' }));
        return;
    }

    const session = userSessions.get(ws)!;
    const ssh = new SSHClient();

    let cleanedUp = false;
    function cleanup() {
        if (cleanedUp) return;
        cleanedUp = true;
        connections.delete(ws);
        ssh.removeAllListeners();
        ssh.end();
    }

    ssh.on('ready', () => {
        ws.send(JSON.stringify({ type: 'status', message: 'SSH connected' }));

        ssh.shell((err, stream) => {
            if (err) {
                ws.send(JSON.stringify({ type: 'error', message: err.message }));
                return cleanup();
            }

            connections.set(ws, { ssh, stream });

            stream.on('data', (data: any) => {
                ws.send(JSON.stringify({
                    type: 'output',
                    data: data.toString()
                }));
            });

            stream.on('close', () => {
                ws.send(JSON.stringify({ type: 'status', message: 'SSH session closed' }));
                cleanup();
            });

            stream.stderr.on('data', (data) => {
                ws.send(JSON.stringify({
                    type: 'error',
                    data: data.toString()
                }));
            });
        });
    });

    ssh.on('error', (err) => {
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
        cleanup();
    });

    ssh.on('close', () => {
        cleanup();
    });

    ssh.connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        privateKey: session.privateKey,
        readyTimeout: 10000,
    });
}

function sendCommand(ws: ServerWebSocket, command: string) {
    if (!isAuthenticated(ws)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
        return;
    }

    const connection = connections.get(ws);
    if (!connection?.stream || connection.stream.destroyed) {
        ws.send(JSON.stringify({ type: 'error', message: 'No active SSH connection' }));
        return;
    }

    connection.stream.write(command + '\n');
}

function disconnectFromVM(ws: ServerWebSocket) {
    const connection = connections.get(ws);
    if (connection) {
        if (connection.stream) {
            connection.stream.end();
        }
        if (connection.ssh) {
            connection.ssh.end();
        }
        connections.delete(ws);
    }

    userSessions.delete(ws);
}
