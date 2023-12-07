/**
 * Script for creating a window. Runs when the main process forks a new window on the node side.
 */
import * as process from "process";
import { Webview } from "webview-nodejs";

function main() {
    const wsPort = process.env["KARA_WS_PORT"] as string;
    const wsToken = process.env["KARA_WS_TOKEN"] as string;
    const id = process.env["KARA_ID"] as string;
    console.log("Spawning window with id " + id + ", port " + wsPort);

    const w = new Webview(process.env["KARA_DEBUG"] === "1");

    // Basic APIs
    w.bind("_KARA_NAVIGATE_", (w, url) => {
        w.navigate(url);
    });
    w.bind("_KARA_SET_TITLE_", (w, s) => {
        w.title(s);
    });
    w.bind("_KARA_STOP_", (w) => {
        w.terminate();
    });
    w.bind("_KARA_SET_HTML_", (w, s) => {
        w.html(s);
    });
    w.bind("_KARA_EVAL_", (w, s) => {
        w.eval(s);
    });
    w.bind("_KARA_SET_SIZE_", (w, a, b) => {
        w.size(a, b);
    });
    w.init(getInitScript(id, wsPort, wsToken));
    w.navigate("about:blank");
    w.show();
    w.destroy();
    w.terminate();
}

function getInitScript(id: string, wsPort: string, wsToken: string): string {
    // Generates a bare minimum script for core handlers. Client script can hack to enable more IPC features.
    return `
   window._KARA_ID_ = "${id}";
   window._KARA_WS_PORT_ = "${wsPort}";
   window._KARA_WS_TOKEN_ = "${wsToken}";
   window._KARA_WS_ = new WebSocket("ws://localhost:${wsPort}");
   window._KARA_WS_.onmessage = (e)=>{
     const {token, type, body} = JSON.parse(e.data.toString());
     if (token !== window._KARA_WS_TOKEN_) return;
     if (type === "system") {
       const {method, args} = JSON.parse(body);
       if (method === "navigate") {
         window._KARA_NAVIGATE_(args[0]);
       }
       if (method === "setTitle") {
         window._KARA_SET_TITLE_(args[0]);
       }
       if (method === "stop") {
         window._KARA_STOP_();
       }
       if (method === "setHTML") {
         window._KARA_SET_HTML_(args[0]);
       }
       if (method === "eval") {
         window._KARA_EVAL_(args[0]);
       }
       if (method === "setSize") {
         window._KARA_SET_SIZE_(args[0], args[1]);
       }
     }
   };
   window._KARA_WS_.onopen = ()=>{
     window._KARA_WS_.send(JSON.stringify({
        id: window._KARA_ID_,
        token: window._KARA_WS_TOKEN_,
        body: "_WS_REG_"
     }));
   }
   `;
}

void main();