import { readFile } from "fs-extra";
import path from "node:path";
import * as KaraMain from "./api/KaraMain";
import { getAppConfig, readAppConfig } from "./AppConfig";

/**
 * Main loader for Kara when being called directly (not as a library).
 */
export async function main() {
    const entry = path.resolve(process.argv[process.argv.length - 1] || ".");
    await readAppConfig(entry);
    process.chdir(entry);
    const src = await readFile(getAppConfig().main);

    const nodeRequire = require;
    // @ts-ignore
    globalThis.require = (mod: string) => {
        if (mod.toLowerCase() === "kara") {
            return KaraMain;
        } else {
            return nodeRequire(mod);
        }
    };
    globalThis.eval(src.toString());
}

void main();