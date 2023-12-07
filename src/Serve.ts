import getPort from "get-port";
import http from "http";
import handler from "serve-handler";

export interface ServeHandler {
    port: number;
    server: http.Server;
}

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
            res({
                port, server
            });
        });
    });
}