# kara.js

UI in browser, from scratch.

This project is part of the **Alicorn Again Series**. Providing lightweight, debloated UI framework for the applications.

Please note that this project is still at a very early stage. APIs might not be stable and the framework itself is not well-tested nor for production use.

## Example

Below shows a minimal "hello, world" example covering basic concepts.

1. Clone this repository (as kara hasn't been published to NPM):
   
   ```shell
   git clone https://github.com/skjsjhb/kara.git --depth 1
   ```

2. Install dependencies and build:
   
   ```shell
   pnpm install && pnpm build
   ```

3. Create some files in the `build` directory:
   
   ```js
   // example.js (Entry point)
   const { app, BrowserWindow, ipcMain, serve } = require("kara");
   
   async function main() {
       await app.whenReady();
       const b = new BrowserWindow({ debug: true });
       await b.whenReady();
       ipcMain.handle("ping", async () => {
           console.log("Client said ping!");
           return "world!";
       });
       const sh = await serve.serveDir(".");
       b.setTitle("KARA");
       await b.loadURL("http://localhost:" + sh.port + "/Main.html");
       app.on("all-window-closed", () => {
           console.log("Closing!");
           ipcMain.closeSocket();
           sh.server.close();
       });
   }
   
   void main();
   ```
   
   ```html
   <!-- Main.html (For displaying content) -->
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <title>KARA Browser UI</title>
       <script src="./client.js"></script>
   </head>
   <body>
   <h1>Welcome to KARA!</h1>
   <script>
       (async()=>{
           const res = await ipcRenderer.invoke("ping");
           document.write("hello, " + res);
       })();
   </script>
   </body>
   </html>
   ```

4. Run the application:
   
   ```shell
   node main.js example.js
   ```
   
   You should see `hello, world` appears on the screen.

## Trivias

- As you've noticed, some APIs are similar to Electron. This is designed as so. Instead of inventing a brand new set of concepts, we would rather prefer adopting existing, well-tested standards. However, kara.js does not aim to cover Electron APIs or become an alternative. Electron contains a bundled browser, increasing its size but also bringing essential APIs for its strong core features, while kara would never be able to do so.

- To package the application, simply `upx` your `node.exe` and put it together with all the scripts. Write a launch script or small wrapper program for that. We'll offer more alternatives soon.
