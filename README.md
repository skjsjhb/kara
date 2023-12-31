# kara.js

UI in browser, from scratch.

This project is part of the **Alicorn Again Series**. Providing lightweight, debloated UI framework for the applications.

Please note that this project is still at a very early stage. APIs might not be stable and the framework itself is not well-tested nor for production use.

## Motivation

I've always been a fan of Electron.js. It makes desktop development much more easier than it was. However, by creating a flat land for everyone to play, Electron comes with a bundled Chromium, which, considerably, increased the size of the application. Don't misunderstand - Electron is an awesome framework for most **applications**. But for a tool like **alal.js**, game launcher, a browser bundled might not, it seems, that necessary.

After noticed [webview/webview](https://github.com/webview/webview) I came up with the idea of getting Node.js and webview to work together. And here is kara, the framework. Based on the example-like `karac` as its backend, with a simple WebSocket IPC messaging and some wrapper methods, you can now build UI in browser using kara.

So here comes the summary:

- Instead of a bundled browser, kara uses webview to utilize the browser already installed on the system.

- Unlike other "Nodeless" approaches, but more similar to DeskGap, kara bundles a Node.js instance to support code evaluation, maintaining high performance with low cost, and make it possible to reuse millions of packages from NPM. (I personally believe using a browser is not necessary, but Node.js is awesome - JS is everything you need!)

- No special configuration is needed when building - The main process is just a **regular Node.js process**, and the renderer process is just a **pure browser process** (with a few pre-defined extensions). You can use any tools you like without worrying about resolution problems, rebuilding addons, etc.

## Example

### Basic Example

Below shows a minimal "hello, world" example covering basic concepts. Note we're not using any Node.js tools here! Everything are just plain files. In more complexed projects, you might use build tools and other frameworks, but just keep in mind that kara only executes your entry script, without any magic.

1. Gets the latest release from the release page. Download and decompress it and you shall see `kara` (`kara.exe`) in the root directory.

2. Create some files in the root directory:
   
   ```js
   // example.js (Entry point)
   const { app, BrowserWindow, ipcMain, serve } = require("kara");
   
   async function main() {
       await app.whenReady();
       const b = new BrowserWindow({ debug: true });
       await b.whenReady();
       ipcMain.handle("getUserName", async () => {
           return require("os").userInfo().username;
       });
       const sh = await serve.serveDir(".");
       b.setTitle("Hello World");
       await b.loadURL("http://localhost:" + sh.port + "/Main.html");
       app.on("all-window-closed", () => {
           ipcMain.closeSocket();
           sh.server.close();
       });
   }
   
   void main();
   ```
   
   ```json
   // app-config.json (App manifest)
   {
     "main": "example.js",
     "name": "org.example.hello-world",
     "version": "1.0.0",
     "loader": "client.js"
   }
   ```
   
   ```css
   /* styles.css (Just a regular stylesheet) */
   html, body {
     height: 100%;
     width: 100%;
     overflow: hidden;
   }
   
   #container {
     display: flex;
     justify-content: center;
     align-items: center;
     width: 100%;
     height: 100%;
   }
   ```
   
   ```html
   <!-- Main.html (For displaying content) -->
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <link rel="stylesheet" type="text/css" href="./styles.css"/>
   </head>
   <body>
       <div id="container">
         <h1 id="out"></h1>
       </div>
       <script>
           ipcRenderer.invoke("getUserName").then((u)=>{
             document.getElementById("out").innerText = "Hello " + u;
           });
       </script>
   </body>
   </html>
   ```

3. Run the application:
   
   ```shell
   kara example.js # Windows
   ./kara example.js # Unix
   ```
   
   You should see `Hello (Your Name)` appears on the screen.

### Use As a Package

kara, or say `@skjsjhb/kara`, is published on GitHub rather than the npm registry. You do not need to become a maintainer to use them, but you'll want to authenticate with GitHub npm registry as described in [Working with the npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry). Then, add the following to your project root:

For yarn (v2 and above):

```yml
npmScopes: 
  skjsjhb: 
    npmRegistryServer: https://npm.pkg.github.com
```

For yarn v1, pnpm and npm:

```ini
@skjsjhb:registry=https://npm.pkg.github.com
```

And add your token to `~/.npmrc` or `~/.yarnrc`.

Then you'll be able to install kara as a package.

```shell
npm install @skjsjhb/kara --save-dev # npm
yarn add @skjsjhb/kara --dev # yarn
pnpm add @skjsjhb/kara --save-dev # pnpm
```

Now, write your code and generate them as regular. Put all your files together and add an `app-config.json` as described above. Note that you need to copy `node_modules/@skjsjhb/kara/dist/client.js` to the same directory your `app-config.json` is located in. After this, run:

```shell
npx kara <Path/To/Directory/With/AppConfig>
```

Your app should launch if prebuilt karac binaries are present.

## Trivias

- As you've noticed, some APIs are similar to Electron. This is designed as so. Instead of inventing a brand new set of concepts, we would rather prefer adopting existing, well-tested standards. However, kara.js does not aim to cover Electron APIs nor become an alternative. Electron contains a bundled browser, increasing its size but also bringing essential APIs for its strong core features, while kara would never be able to do so.

- On Windows, browser data of applications without manifest will be stored using the name of the executable as an identifier. You might want to rename `karac.exe` to avoid name collision. Be sure to also update `app-config.json` if doing so.
