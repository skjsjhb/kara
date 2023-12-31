/**
 * WebSocket based IPC protocol.
 */

import crypto from "crypto";
import getPort from "get-port";
import { TinyEmitter } from "tiny-emitter";
import { WebSocket, WebSocketServer } from "ws";
import { IPCMainEvent } from "./IPCMain";

let wsHost: WebSocketServer;
let wsPort: number;
let listenerMap: Map<string, ListenerProc> = new Map();
let wsMap: Map<string, WebSocket> = new Map();
let wsAliveMap: Map<string, NodeJS.Timeout> = new Map();
let emitter = new TinyEmitter();

interface ListenerProc {
    id: string;
    token: string;
    onopen: () => void;
    onclose: () => void;
}

interface WebSocketRequest {
    id?: string;
    token?: string;
    body?: string;
}

export async function setupWebSocket() {
    wsPort = await getPort();
    wsHost = new WebSocketServer({port: wsPort});
    wsHost.on("error", (e) => {
        console.warn("Error in WebSocket server: " + e);
    });
    wsHost.on("connection", (ws) => {
        ws.on("message", (data) => {
            try {
                const {id, token, body}: WebSocketRequest = JSON.parse(data.toString());
                if (typeof id != "string") {
                    return;
                }
                const proc = listenerMap.get(id);
                if (!proc || proc?.token !== token || typeof body != "string") {
                    return;
                }
                if (body == "_WS_REG_") {
                    // Magic literal for register
                    wsMap.set(id, ws);

                    clearTimeout(wsAliveMap.get(id));
                    ws.on("close", () => {
                        wsAliveMap.set(id, setTimeout(() => {
                            proc.onclose();
                        }, 200));
                    });

                    proc.onopen();
                    return;
                } else {
                    const {channel, args} = JSON.parse(body);
                    const e: IPCMainEvent = {
                        id, token, ws
                    };
                    emitter.emit(channel, e, ...args);
                }
            } catch {
                // No-op
            }
        });
    });
}

export function getWebSocketPort(): number {
    return wsPort;
}


/**
 * Waits until a register request established with the given ID.
 */
export function listen(id: string, onopen: () => void, onclose: () => void): string {
    const token = genToken();
    listenerMap.set(id, {
        id, token, onopen, onclose
    });
    return token;
}

function genToken(): string {
    return crypto.randomBytes(64).toString("hex");
}


/**
 * Remove the listener.
 */
export function unlisten(id: string): void {
    listenerMap.delete(id);
}

export function getWebSocket(id: string): WebSocket | null {
    return wsMap.get(id) ?? null;
}

export function getMessageEmitter(): TinyEmitter {
    return emitter;
}

export function closeWebSocketServer() {
    wsHost.close();
}