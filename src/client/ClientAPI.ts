/**
 * Runs in the browser environment, providing window features.
 */
import { IPCRenderer } from "./IPCRenderer";


interface KaraAPIs {
    ipcRenderer: IPCRenderer;
}

function karaRequire(mod: string): any {
    if (mod == "kara") {
        const api: KaraAPIs = {
            ipcRenderer: IPCRenderer.get()
        };
        return api;
    }
    return undefined;
}

function setupAPIs() {
    Object.defineProperty(window, "require", {value: karaRequire});
    Object.defineProperty(window, "ipcRenderer", {value: IPCRenderer.get()});
    IPCRenderer.get().on("_getURL", (eid: string) => {
        IPCRenderer.get().send("_getURL", eid, location.href);
    });
}

void setupAPIs();