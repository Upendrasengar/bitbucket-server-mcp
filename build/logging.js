let serverRef;
function log(level, message, data) {
    if (!serverRef)
        return;
    try {
        serverRef.sendLoggingMessage({
            level,
            logger: "bitbucket-mcp",
            data: data ? `${message} ${JSON.stringify(data)}` : message,
        });
    }
    catch {
        // Server not connected yet or client disconnected; ignore silently
    }
}
export const logger = {
    debug: (message, data) => log("debug", message, data),
    info: (message, data) => log("info", message, data),
    warn: (message, data) => log("warning", message, data),
    error: (message, data) => log("error", message, data),
};
export function attachLogger(server) {
    serverRef = server;
    return logger;
}
//# sourceMappingURL=logging.js.map