import { App } from "./App";
import { BrowserWindow } from "./BrowserWindow";
import { IPCMain } from "./IPCMain";
import { serveDir } from "./Serve";
import { closeWebSocketServer } from "./Transmitter";

async function main() {
    const app = App.get();
    await app.whenReady();
    const b = new BrowserWindow({debug: true});
    await b.whenReady();
    console.log("Browser window ready.");
    const sh = await serveDir(".");
    const ipcMain = IPCMain.get();

    ipcMain.handle("ping", async () => {
        console.log("Received ping");
        return "world!";
    });
    app.on("all-window-closed", () => {
        sh.server.close();
        closeWebSocketServer();
    });
    b.navigate("http://localhost:" + sh.port + "/Main.html");
    await b.whenReady();
    b.on("close", () => {
        console.log("Window is closed.");
    });
}

void main();