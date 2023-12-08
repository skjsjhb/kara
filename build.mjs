import * as esbuild from 'esbuild';
import { existsSync } from "node:fs";
import * as os from "os";

const checkFiles = [
    os.platform() === "win32" ? "build/karac.exe" : "build/karac"
];

if (!checkFiles.every(existsSync)) {
    console.log("You're missing files for build. Please check the build instruction.");
}

await esbuild.build({
    entryPoints: ['src/client/ClientAPI.ts'],
    bundle: true,
    platform: "browser",
    minify: true,
    outfile: 'build/client.js'
});

await esbuild.build({
    entryPoints: ['src/Main.ts'],
    bundle: true,
    platform: "node",
    minify: true,
    outfile: 'build/main.js'
});