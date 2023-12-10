import getPort from "get-port";
import http from "http";
import handler from "serve-handler";

export interface ServeHandler {
    port: number;
    server: http.Server;
}

const handlers: Set<ServeHandler> = new Set();

/**
 * Serve a directory.
 */
export async function serveDir(dest: string): Promise<ServeHandler> {
    const server = http.createServer((req, res) => {
        handler(req, res, {
            public: dest
        });
    });
    return new Promise(async (res) => {
        const port = await getPort();
        server.listen(port, () => {
            const h = {
                port, server
            };

            // Index for closing
            handlers.add(h);
            h.server.on("close", () => {
                handlers.delete(h);
            });

            res(h);
        });
    });
}

export function closeServeHandlers(): void {
    handlers.forEach(h => h.server.close());
}