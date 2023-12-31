import { readFile } from "fs-extra";
import path from "node:path";
import * as vm from "vm";
import * as KaraMain from "./api/KaraMain";
import { getAppConfig, readAppConfig } from "./AppConfig";

/**
 * Main loader for Kara when being called directly (not as a library).
 */
export async function main() {
    let entry;
    if (process.argv0 == process.argv[process.argv.length - 1]) {
        entry = path.resolve(".");
    } else {
        entry = path.resolve(process.argv[process.argv.length - 1] || ".");
    }
    process.chdir(entry);
    await readAppConfig(entry);
    const filename = getAppConfig().main;
    const src = await readFile(filename);

    const nodeRequire = require;
    // @ts-ignore
    globalThis.require = (mod: string) => {
        if (mod.toLowerCase() === "kara") {
            return KaraMain;
        } else {
            return nodeRequire(mod);
        }
    };
    vm.runInThisContext(src.toString(), {filename});
}

void main();