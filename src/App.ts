import { TinyEmitter } from "tiny-emitter";
import { setupWebSocket } from "./Transmitter";

export async function setupApp() {
    await setupWebSocket();
}

interface AppWithEvents {
    /**
     * Fired when all created {@link BrowserWindow}s are closed. This event can be fired multiple times when
     * destroying the last instance of the window.
     */
    on(e: "all-window-closed", l: () => any): void;

    /**
     * Fired when the app is ready.
     */
    on(e: "ready", l: () => any): void;
}

export class App implements AppWithEvents {
    protected emitter = new TinyEmitter();
    static self: App;

    on = this.emitter.on.bind(this.emitter);
    off = this.emitter.off.bind(this.emitter);
    once = this.emitter.once.bind(this.emitter);
    emit = this.emitter.emit.bind(this.emitter);

    ready = false;

    constructor() {
        (async () => {
            await setupWebSocket();
            this.ready = true;
            this.emit("ready");
        })();
    }

    whenReady(): Promise<void> {
        if (this.ready) {
            return Promise.resolve();
        }
        return new Promise(res => {
            this.on("ready", res);
        });
    }

    static get(): App {
        if (!App.self) {
            App.self = new App();
        }
        return App.self;
    }
}