import { TinyEmitter } from "tiny-emitter";
import { setupWebSocket } from "./Transmitter";

export async function setupApp() {
    await setupWebSocket();
}

export class App {
    protected emitter = new TinyEmitter();
    static self: App;

    on = this.emitter.on.bind(this.emitter);
    off = this.emitter.off.bind(this.emitter);
    once = this.emitter.once.bind(this.emitter);
    emit = this.emitter.emit.bind(this.emitter);

    readyFlag = false;
    readyListeners: (() => void)[] = [];

    constructor() {
        (async () => {
            await setupWebSocket();
            this.readyFlag = true;
            this.readyListeners.forEach(f => f());
        })();
    }

    whenReady(): Promise<void> {
        if (this.readyFlag) {
            return Promise.resolve();
        }
        return new Promise(res => {
            this.readyListeners.push(res);
        });
    }

    static get(): App {
        if (!App.self) {
            App.self = new App();
        }
        return App.self;
    }
}