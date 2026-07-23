import { formatResponse } from "../response/format.js";
import { toolAnnotations } from "../response/annotations.js";
import { handleToolError } from "../http/errors.js";
export function registerSystemTools(ctx) {
    const { server, clients } = ctx;
    server.registerTool("get_server_info", {
        description: "Get Bitbucket Server version and properties. Useful to check connectivity and server version.",
        inputSchema: {},
        annotations: toolAnnotations(),
    }, async () => {
        try {
            const data = await clients.api.get("application-properties").json();
            return formatResponse(data);
        }
        catch (error) {
            return handleToolError(error);
        }
    });
}
//# sourceMappingURL=system.js.map