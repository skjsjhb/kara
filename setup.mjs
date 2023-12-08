import { ensureDir } from "fs-extra";
import { createGlobalProxyAgent } from "global-agent";
import fetch from "node-fetch";
import { createWriteStream } from "node:fs";
import * as os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";

const agent = createGlobalProxyAgent();
const karacVersion = "alpha";
const suffix = os.platform() + "-" + os.arch() + (os.platform() === "win32" ? ".exe" : "");
const karacUrl = `https://github.com/skjsjhb/karac/releases/download/${karacVersion}/karac-${suffix}`;
console.log("Downloading " + karacUrl);
const res = await fetch(karacUrl, { agent });
const target = "build/karac" + (os.platform() === "win32" ? ".exe" : "");
await ensureDir(path.dirname(target));
await pipeline(res.body, createWriteStream(target));