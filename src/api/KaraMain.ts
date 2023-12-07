import { App } from "../App";
import { IPCMain } from "../IPCMain";
import * as Serve from "../Serve";

export const app = App.get();

export * from "../BrowserWindow";

export const ipcMain = IPCMain.get();

export module serve {
    export const serveDir = Serve.serveDir;
}