export class ToolContext {
    server;
    clients;
    cache;
    logger;
    defaultProject;
    maxLinesPerFile;
    constructor(params) {
        this.server = params.server;
        this.clients = params.clients;
        this.cache = params.cache;
        this.logger = params.logger;
        this.defaultProject = params.defaultProject;
        this.maxLinesPerFile = params.maxLinesPerFile ?? 500;
    }
    resolveProject(provided) {
        const project = provided || this.defaultProject;
        if (!project) {
            throw new Error("Project is required. Provide it as a parameter or set BITBUCKET_DEFAULT_PROJECT.");
        }
        return project;
    }
}
export async function mergeDefaultReviewers(params) {
    const { clients, resolvedProject, repository, srcProject, srcRepo, sourceBranch, targetBranch, existingReviewers, } = params;
    const allReviewers = [...existingReviewers];
    try {
        const [sourceRepoData, targetRepoData] = await Promise.all([
            clients.api
                .get(`projects/${srcProject}/repos/${srcRepo}`)
                .json(),
            srcProject === resolvedProject && srcRepo === repository
                ? Promise.resolve(null)
                : clients.api
                    .get(`projects/${resolvedProject}/repos/${repository}`)
                    .json(),
        ]);
        const sourceRepoId = sourceRepoData.id;
        const targetRepoId = targetRepoData ? targetRepoData.id : sourceRepoData.id;
        const defaultReviewersList = await clients.defaultReviewers
            .get(`projects/${resolvedProject}/repos/${repository}/reviewers`, {
            searchParams: {
                sourceRepoId,
                targetRepoId,
                sourceRefId: `refs/heads/${sourceBranch}`,
                targetRefId: `refs/heads/${targetBranch}`,
            },
        })
            .json();
        if (Array.isArray(defaultReviewersList)) {
            const existingNames = new Set(allReviewers.map((r) => r.user.name));
            for (const reviewer of defaultReviewersList) {
                if (!existingNames.has(reviewer.name)) {
                    allReviewers.push({ user: { name: reviewer.name } });
                    existingNames.add(reviewer.name);
                }
            }
        }
    }
    catch {
        // Proceed without default reviewers on error
    }
    return allReviewers;
}
//# sourceMappingURL=shared.js.map