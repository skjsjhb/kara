/**
 * Represents a single webview window.
 *
 * Note that due to the limitation of webview APIs, a process can own only one window instance. Methods
 * of the windows are implemented using IPC.
 */

import { spawn } from "child_process";
import { EventEmitter } from "events";
import { ChildProcess } from "node:child_process";
import * as path from "path";
import * as uuid from "uuid";
import { App } from "./App";
import { getWebSocket, getWebSocketPort, listen } from "./Transmitter";

export interface BrowserWindowOptions {
    debug?: boolean;
}

export class BrowserWindow {
    /**
     * Child process of this window.
     */
    protected proc: ChildProcess;
    /**
     * Window unique id.
     */
    protected id: string;

    /**
     * WebSocket IPC token.
     */
    protected token: string;

    /**
     * Event emitter for window events.
     */
    protected emitter: EventEmitter = new EventEmitter();

    protected readyHooks: (() => void)[] = [];

    protected ready: boolean = false;

    static instanceCount = 0;

    constructor(options?: BrowserWindowOptions) {
        BrowserWindow.instanceCount++;
        this.id = uuid.v4();
        console.log("Creating window with id " + this.id);
        this.token = listen(this.id,
            () => {
                this.ready = true;
                this.readyHooks.forEach(f => f());
                this.emitter.emit("ready");
            },
            () => {
                console.log("Window is closing: " + this.id);
                this.close();
                this.emitter.emit("close");
            }
        );
        this.proc = spawn(process.execPath, [path.join(__dirname, "client-bootloader.js")], {
            env: {
                KARA_DEBUG: options?.debug ? "1" : "0",
                KARA_ID: this.id,
                KARA_WS_PORT: getWebSocketPort().toString(),
                KARA_WS_TOKEN: this.token
            },
            detached: true
        });
        console.log("Forked process " + this.proc.pid);
        this.proc.stdout?.on("data", (d) => {
            console.log(d.toString());
        });

        this.proc.stderr?.on("data", (d) => {
            console.log(d.toString());
        });
    }

    // Event emitters
    on = this.emitter.on.bind(this.emitter);
    off = this.emitter.off.bind(this.emitter);
    once = this.emitter.once.bind(this.emitter);
    removeAllListeners = this.emitter.removeAllListeners.bind(this.emitter);

    /**
     * Gets a Promise which resolves when the corresponding WS connection is established.
     */
    whenReady(): Promise<void> {
        if (this.ready) {
            return Promise.resolve();
        }
        return new Promise(res => {
            this.readyHooks.push(res);
        });
    }

    /**
     * Gets the identifier of this window.
     */
    getId() {
        return this.id;
    }

    protected sysCall(method: string, ...args: any[]) {
        const ws = getWebSocket(this.id);
        if (!ws) {
            console.log("WebSocket for " + this.id + " is not established. Skipped request.");
            return;
        }
        ws.send(JSON.stringify({
            token: this.token,
            type: "system",
            body: JSON.stringify({method, args})
        }));
    }

    /**
     * Trys to close the window using SIGINT to terminate the process.
     */
    close(): void {
        BrowserWindow.instanceCount--;
        this.sysCall("stop");
        this.proc.kill();
        if (BrowserWindow.instanceCount == 0) {
            App.get().emit("all-window-closed");
        }
    }

    setTitle(t: string): void {
        this.sysCall("setTitle", t);
    }

    setHTML(s: string): void {
        this.ready = false;
        this.sysCall("setHTML", s);
    }

    setSize(w: number, h: number): void {
        this.sysCall("setSize", w, h);
    }

    navigate(url: string): void {
        this.ready = false;
        this.sysCall("navigate", url);
    }

    loadURL(url: string): Promise<void> {
        this.navigate(url);
        return this.whenReady();
    }

    reload(): void {
        this.eval("location.reload()");
    }

    send(channel: string, ...args: any[]) {
        const ws = getWebSocket(this.id);
        if (!ws) {
            console.log("WebSocket for " + this.id + " is not established. Skipped request.");
            return;
        }
        ws.send(JSON.stringify({
            token: this.token,
            type: "application",
            body: JSON.stringify({channel, args})
        }));
    }

    eval(s: string): void {
        this.sysCall("eval", s);
    }
}

