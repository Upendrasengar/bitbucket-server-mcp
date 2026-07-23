/**
 * Provisions the minimum state every `comments` test needs: a project,
 * a repo with two branches (main + feature) each with its own commit,
 * and an open PR between them. Uses Bitbucket's `browse` endpoint,
 * which accepts commits via a multipart form (`content`, `message`,
 * `branch`, `sourceBranch`). No git CLI, no shell.
 */
export async function bootstrap(api) {
    const projectKey = "E2E";
    const repoSlug = "demo";
    await api.post("projects", { json: { key: projectKey, name: "E2E" } });
    await api.post(`projects/${projectKey}/repos`, { json: { name: repoSlug } });
    const commit = async (branch, path, content, message, sourceBranch) => {
        const form = new FormData();
        form.append("content", content);
        form.append("message", message);
        form.append("branch", branch);
        if (sourceBranch !== undefined)
            form.append("sourceBranch", sourceBranch);
        const result = await api
            .put(`projects/${projectKey}/repos/${repoSlug}/browse/${path}`, {
            body: form,
        })
            .json();
        return result.id;
    };
    const mainCommitId = await commit("main", "README.md", "hello\n", "init");
    await commit("feature", "CHANGE.md", "change\n", "change", "main");
    const pr = await api
        .post(`projects/${projectKey}/repos/${repoSlug}/pull-requests`, {
        json: {
            title: "E2E PR",
            fromRef: {
                id: "refs/heads/feature",
                repository: { slug: repoSlug, project: { key: projectKey } },
            },
            toRef: {
                id: "refs/heads/main",
                repository: { slug: repoSlug, project: { key: projectKey } },
            },
        },
    })
        .json();
    return { projectKey, repoSlug, prId: pr.id, mainCommitId };
}
export async function createComment(api, s, text) {
    return api
        .post(`projects/${s.projectKey}/repos/${s.repoSlug}/pull-requests/${s.prId}/comments`, { json: { text } })
        .json();
}
//# sourceMappingURL=bootstrap.js.map