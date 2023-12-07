import * as esbuild from 'esbuild';
import { nativeNodeModulesPlugin } from "esbuild-native-node-modules-plugin";
import { copy } from "fs-extra";

await esbuild.build({
    entryPoints: ['src/client/ClientBootLoader.ts'],
    bundle: true,
    platform: "node",
    outfile: 'build/client-bootloader.js',
    plugins: [
        nativeNodeModulesPlugin
    ]
});

await esbuild.build({
    entryPoints: ['src/Main.ts'],
    bundle: true,
    platform: "node",
    outfile: 'build/main.js'
});

await copy("node_modules/webview-nodejs/dist/libs", "build/libs");
