import { IPCRenderer } from "./src/client/IPCRenderer";

declare global {
    const ipcRenderer: IPCRenderer;
}