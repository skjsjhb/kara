import { App } from "./src/App";
import { type BrowserWindow } from "./src/BrowserWindow";
import { type IPCMain } from "./src/IPCMain";
import * as Serve from "./src/Serve";

export const app: App;

export const serve: typeof Serve;

export const ipcMain: IPCMain;

export {
    BrowserWindow
};