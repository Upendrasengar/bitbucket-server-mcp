import { z } from "zod";
import { formatResponse } from "../response/format.js";
import { toolAnnotations } from "../response/annotations.js";
import { handleToolError } from "../http/errors.js";
import { projectParam, repositoryParam, fieldsParam } from "./params.js";
import { curateList, DEFAULT_REVIEWER_GROUP_FIELDS, } from "../response/curate.js";
const reviewerGroupActions = {
    create: async ({ clients, resolvedProject, repository, name, description, reviewers, }) => {
        const data = await clients.api
            .post(`projects/${resolvedProject}/repos/${repository}/settings/reviewer-groups`, {
            json: {
                name,
                description,
                reviewers: reviewers?.map((r) => ({ name: r })),
            },
        })
            .json();
        return formatResponse(data);
    },
    delete: async ({ clients, resolvedProject, repository, name }) => {
        await clients.api.delete(`projects/${resolvedProject}/repos/${repository}/settings/reviewer-groups/${name}`);
        return formatResponse({ deleted: true, name });
    },
};
export function registerReviewerGroupTools(ctx) {
    const { server, clients } = ctx;
    server.registerTool("list_reviewer_groups", {
        description: "List reviewer groups configured for a repository.",
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
                .get(`projects/${resolvedProject}/repos/${repository}/settings/reviewer-groups`)
                .json();
            return formatResponse(curateList(data.values, fields ?? DEFAULT_REVIEWER_GROUP_FIELDS));
        }
        catch (error) {
            return handleToolError(error);
        }
    });
    server.registerTool("manage_reviewer_groups", {
        description: 'Manage reviewer groups for a repository. Actions: "create" (create a group), "delete" (remove a group).',
        inputSchema: {
            action: z.enum(["create", "delete"]).describe("Operation to perform."),
            project: projectParam(),
            repository: repositoryParam(),
            name: z.string().describe("Reviewer group name."),
            description: z
                .string()
                .optional()
                .describe("Group description (create only)."),
            reviewers: z
                .array(z.string())
                .optional()
                .describe("Usernames to include in the group (create only)."),
        },
        annotations: toolAnnotations({
            readOnlyHint: false,
            idempotentHint: false,
        }),
    }, async ({ action, project, repository, name, description, reviewers }) => {
        try {
            const resolvedProject = ctx.resolveProject(project);
            const handler = reviewerGroupActions[action];
            return await handler({
                clients,
                resolvedProject,
                repository,
                name,
                description,
                reviewers,
            });
        }
        catch (error) {
            return handleToolError(error);
        }
    });
}
//# sourceMappingURL=reviewer-groups.js.map