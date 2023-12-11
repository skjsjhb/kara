import { App } from "./src/App";
import { BrowserWindow } from "./src/BrowserWindow";
import { IPCMain } from "./src/IPCMain";
import * as Serve from "./src/Serve";

export const app: App;

export const serve: typeof Serve;

export const ipcMain: IPCMain;

export {
    BrowserWindow
};