import { readJSON } from "fs-extra";
import path from "node:path";

export interface AppConfig {
    id: string; // Unique name
    version: string; // App version
    main: string; // Entry script
    loader: string; // Path to custom karac loader, default client.js
    debug?: boolean; // Enable debug mode
    karac?: string; // Path to karac binary
}

const APP_CONFIG_NAME = "app-config.json";

let config: AppConfig;

export async function readAppConfig(dir: string) {
    try {
        config = await readJSON(path.join(dir, APP_CONFIG_NAME)) as AppConfig;
    } catch (e) {
        throw "Could not load app config: " + e;
    }
}

export function getAppConfig() {
    return config;
}

