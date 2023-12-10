import { spawn } from "child_process";
import { nanoid } from "nanoid";
import { ChildProcess } from "node:child_process";
import * as os from "os";
import * as path from "path";
import { TinyEmitter } from "tiny-emitter";
import * as uuid from "uuid";
import { App } from "./App";
import { getAppConfig } from "./AppConfig";
import { IPCMain } from "./IPCMain";
import { getWebSocket, getWebSocketPort, listen } from "./Transmitter";

export interface BrowserWindowOptions {
    debug?: boolean;
}

interface BrowserWindowWithEvents {
    /**
     * Fired when the WebSocket connection with expected ID is established. The window
     * is ready for receiving IPC messages.
     */
    on(event: "ready", listener: () => any): void;

    /**
     * Fired when the WebSocket connection is lost, effectively the window has been closed. Fired after
     * the process is terminated.
     */
    on(event: "close", listener: () => any): void;
}

/**
 * Represents a single webview window.
 *
 * Note that due to the limitation of webview APIs, a process can own only one window instance. Methods
 * of the windows are implemented using IPC.
 */
export class BrowserWindow implements BrowserWindowWithEvents {
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
    protected emitter = new TinyEmitter();

    /**
     * Ready flag of the window.
     */
    protected ready: boolean = false;

    static instances: Set<BrowserWindow> = new Set();

    /**
     * Creates a new browser window. The process spawn starts immediately and the WebSocket will
     * try to connect as soon as the window is created.
     *
     * This kara uses karac as underlying vendor. karac will be responsible for creating window and inject
     * scripts.
     */
    constructor(options?: BrowserWindowOptions) {
        BrowserWindow.instances.add(this);
        this.id = uuid.v4();
        this.token = listen(this.id,
            () => {
                this.ready = true;
                this.emitter.emit("ready");
            },
            () => {
                this.close();
                this.emitter.emit("close");
            }
        );
        this.proc = spawn(getKaracPath(), [], {
            env: {
                KARA_LOADER_PATH: getAppConfig().loader,
                KARA_DEBUG: options?.debug ? "1" : "0",
                KARA_ID: this.id,
                KARA_WS_PORT: getWebSocketPort().toString(),
                KARA_WS_TOKEN: this.token
            }
        });
        this.proc.stdout?.on("data", (data) => {
            console.log(data.toString());
        });
        this.proc.stderr?.on("data", (data) => {
            console.log(data.toString());
        });
    }

    // Event emitters
    on = this.emitter.on.bind(this.emitter);
    off = this.emitter.off.bind(this.emitter);
    once = this.emitter.once.bind(this.emitter);

    /**
     * Gets a Promise which resolves when the corresponding WS connection is established.
     */
    whenReady(): Promise<void> {
        if (this.ready) {
            return Promise.resolve();
        }
        return new Promise(res => {
            this.once("ready", res);
        });
    }

    /**
     * Gets the identifier of this window.
     */
    getId(): string {
        return this.id;
    }

    /**
     * Gets the renderer process.
     */
    getProcess(): ChildProcess | null {
        return this.proc;
    }

    /**
     * Send a system level IPC message to remote. Used for native method calling.
     */
    protected sysCall(method: string, ...args: any[]) {
        const ws = getWebSocket(this.id);
        if (!ws) {
            console.warn("Premature IPC call: " + this.id + " (" + method + ")");
            return;
        }
        ws.send(JSON.stringify({
            token: this.token,
            type: "system",
            body: JSON.stringify({method, args})
        }));
    }

    /**
     * Tries to close the window using SIGINT to terminate the process. Unclosed windows will be closed
     * when the main process exits.
     */
    close(): void {
        BrowserWindow.instances.delete(this);
        this.sysCall("stop");
        this.proc.kill();
        if (BrowserWindow.instances.size == 0) {
            App.get().emit("all-window-closed");
        }
    }

    /**
     * Sets the title of the window. Unlike Electron, titles are not set automatically when
     * the page navigates but requires an explicit call.
     */
    setTitle(t: string): void {
        this.sysCall("setTitle", t);
    }

    /**
     * Toggles the frame status of the window. Identical to `frame` option in Electron but can be called during runtime.
     *
     * Stability needs to be verified for macOS and Linux.
     */
    setFrame(f: boolean): void {
        this.sysCall("setFrame", f);
    }

    /**
     * Opens DevTools.
     *
     * Note that DevTools can still be manually opened on all platforms if debug flag is set without
     * the necessity of calling this method.
     *
     * @supported Windows, Linux
     */
    openDevTools(): void {
        this.sysCall("openDevTools");
    }

    /**
     * Sets the HTML content of the window.
     *
     * Note that setting HTML content also triggers navigation (i.e. WebSocket re-connection). This method
     * does not resolve links in the HTML file and, due to the limitation of webview, `file://` urls are not
     * supported by default and external scripts will likely not to get loaded.
     */
    setHTML(s: string): void {
        this.ready = false;
        this.sysCall("setHTML", s);
    }

    /**
     * Sets the size of the window.
     */
    setSize(w: number, h: number): void {
        this.sysCall("setSize", w, h);
    }

    /**
     * Starts navigating to the specified URL.
     */
    navigate(url: string): void {
        this.ready = false;
        this.sysCall("navigate", url);
    }

    /**
     * Navigates to a URL and wait for the window to be ready. Effectively `loadURL()` in Electron.
     */
    loadURL(url: string): Promise<void> {
        this.navigate(url);
        return this.whenReady();
    }

    /**
     * Gets `location.href`
     */
    getURL(): Promise<string> {
        const eid = nanoid();
        this.send("_getURL", eid);
        return new Promise((res) => {
            const f = (_e: never, eid0: string, url: string) => {
                if (eid0 == eid) {
                    IPCMain.get().off("_getURL", f);
                    res(url);
                }
            };
            IPCMain.get().on("_getURL", f);
        });

    }

    /**
     * Reload the window.
     */
    reload(): void {
        this.eval("location.reload()");
    }


    /**
     * Sends an application level IPC message with channel and arguments to this window.
     *
     * The message will only be sent when the window is ready, otherwise it's discarded.
     *
     * The message sent can be captured using `ipcRenderer.on(channel, args)`.
     */
    send(channel: string, ...args: any[]) {
        const ws = getWebSocket(this.id);
        if (!ws) {
            return;
        }
        ws.send(JSON.stringify({
            token: this.token,
            type: "application",
            body: JSON.stringify({channel, args})
        }));
    }

    /**
     * Executes script in the window.
     */
    eval(s: string): void {
        this.sysCall("eval", s);
    }

    /**
     * Tries to close all windows.
     */
    static closeAll(): void {
        BrowserWindow.instances.forEach(w => w.close());
    }
}

function getKaracPath(): string {
    let pt = getAppConfig().karac;
    if (pt) {
        return path.resolve(pt);
    }
    return path.resolve(os.platform() == "win32" ? "karac.exe" : "karac");
}