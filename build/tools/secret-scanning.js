import { formatResponse } from "../response/format.js";
import { toolAnnotations } from "../response/annotations.js";
import { handleToolError } from "../http/errors.js";
import { projectParam, repositoryParam, fieldsParam } from "./params.js";
import { curateList, DEFAULT_SECRET_SCANNING_FIELDS, } from "../response/curate.js";
export function registerSecretScanningTools(ctx) {
    const { server, clients } = ctx;
    server.registerTool("list_secret_scanning_rules", {
        description: "List secret scanning allowlist rules for a repository. Requires Bitbucket Server 8.5+.",
        inputSchema: {
            project: projectParam(),
            repository: repositoryParam(),
            fields: fieldsParam(),
        },
        annotations: toolAnnotations(),
    }, async ({ project, repository, fields }) => {
        try {
            const resolvedProject = ctx.resolveProject(project);
            const data = await clients.api
                .get(`projects/${resolvedProject}/repos/${repository}/secret-scanning/allowlist`)
                .json();
            return formatResponse(curateList(data.values, fields ?? DEFAULT_SECRET_SCANNING_FIELDS));
        }
        catch (error) {
            return handleToolError(error);
        }
    });
}
//# sourceMappingURL=secret-scanning.js.map