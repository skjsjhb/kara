import { WebSocket } from "ws";
import { closeWebSocketServer, getEmitter } from "./Transmitter";

export interface IPCMainEvent {
    id: string;
    token: string;
    ws: WebSocket;
}

export class IPCMain {
    protected emitter = getEmitter();

    static self: IPCMain;

    on = this.emitter.on.bind(this.emitter);
    once = this.emitter.once.bind(this.emitter);

    handle(method: string, handler: (...args: any[]) => Promise<any>) {
        this.emitter.on(method, async (e: IPCMainEvent, eid: string, ...args: any[]) => {
            let result, error;
            try {
                result = await handler(...args);
                error = null;
            } catch (e) {
                error = e;
                result = null;
            }
            e.ws.send(JSON.stringify({
                token: e.token,
                type: "application",
                body: JSON.stringify({
                    channel: method,
                    args: [eid, error, result]
                })
            }));
        });
    }

    static get(): IPCMain {
        if (!IPCMain.self) {
            IPCMain.self = new IPCMain();
        }
        return IPCMain.self;
    }

    /**
     * Forward WebSocket server closing method.
     */
    closeSocket() {
        closeWebSocketServer();
    }
}