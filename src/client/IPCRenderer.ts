import { nanoid } from "nanoid";
import { TinyEmitter } from "tiny-emitter";

export class IPCRenderer {
    protected id: string;
    protected token: string;
    protected ws: WebSocket;
    protected emitter = new TinyEmitter();

    static self: IPCRenderer;

    constructor() {
        // @ts-ignore
        this.id = window["_KARA_ID_"];
        // @ts-ignore
        this.token = window["_KARA_WS_TOKEN_"];
        // @ts-ignore
        this.ws = window["_KARA_WS_"];

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
            console.log(channel);
            console.log(args);
            this.emitter.emit(channel, ...args);
        };
    }

    send(channel: string, ...args: any[]): void {
        this.ws.send(JSON.stringify({
            id: this.id,
            token: this.token,
            body: JSON.stringify({
                channel, args
            })
        }));
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