import { App } from "../App";
import { IPCMain } from "../IPCMain";

export module app {
    const app = App.get();

    export function whenReady(): Promise<void> {
        return app.whenReady();
    }
}

export const ipcMain = IPCMain.get();