import { nanoid } from "nanoid";
import { TinyEmitter } from "tiny-emitter";

export class IPCRenderer {
    protected id: string;
    protected token: string;
    protected ws: WebSocket;
    protected emitter = new TinyEmitter();

    ready = false;

    static self: IPCRenderer;

    constructor() {
        // @ts-ignore
        this.id = window["_KARA_ID_"];
        // @ts-ignore
        this.token = window["_KARA_WS_TOKEN_"];
        // @ts-ignore
        this.ws = window["_KARA_WS_"];

        if (this.ws.readyState == WebSocket.OPEN) {
            this.ready = true;
        } else {
            this.ws.addEventListener("open", () => {
                this.ready = true;
            });
        }

        // Add application listeners
        const original = this.ws.onmessage?.bind(this.ws);
        this.ws.onmessage = (e) => {
            if (original) {
                original(e);
            }
            const {token, type, body} = JSON.parse(e.data.toString());
            if (token != this.token || type != "application") {
                return;
            }
            const {channel, args} = JSON.parse(body);
            this.emitter.emit(channel, ...args);
        };
    }

    whenReady(): Promise<void> {
        if (this.ready) {
            return Promise.resolve();
        }
        return new Promise(res => {
            this.ws.addEventListener("open", () => {
                res();
            });
        });

    }

    send(channel: string, ...args: any[]): void {
        (async () => {
            await this.whenReady(); // Make sure connection is established
            this.ws.send(JSON.stringify({
                id: this.id,
                token: this.token,
                body: JSON.stringify({
                    channel, args
                })
            }));
        })();
    }

    invoke(method: string, ...args: any[]): Promise<any> {
        const eid = nanoid();
        return new Promise((res, rej) => {
            this.send(method, eid, ...args);
            const listener = (xid: string, error: any, result: any) => {
                if (xid != eid) {
                    return;
                }
                this.off(method, listener);
                if (error) {
                    rej(error);
                } else {
                    res(result);
                }
            };
            this.emitter.on(method, listener);
        });
    }

    on = this.emitter.on.bind(this.emitter);
    off = this.emitter.off.bind(this.emitter);
    once = this.emitter.once.bind(this.emitter);

    static get(): IPCRenderer {
        if (!IPCRenderer.self) {
            IPCRenderer.self = new IPCRenderer();
        }
        return IPCRenderer.self;
    }
}