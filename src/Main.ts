import { readFile } from "fs/promises";
import * as KaraMain from "./api/KaraMain";

/**
 * Main loader for Kara when being called directly (not as a library).
 */
export async function main() {
    const entry = process.argv[process.argv.length - 1];
    if (!entry || entry == process.execPath) {
        console.error("Invalid script entry. Please specify the entry script.");
        process.exit(1);
    }
    const src = await readFile(entry);
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