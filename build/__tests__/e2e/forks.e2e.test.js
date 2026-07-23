import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { startBitbucket, } from "./bitbucket-container.js";
import { bootstrap } from "./bootstrap.js";
import { setupMcpAgainst } from "./mcp-harness.js";
import { callAndParse } from "../tool-test-utils.js";
import { SELECTED_VERSIONS } from "./versions.js";
describe.each(SELECTED_VERSIONS)("forks: Bitbucket $name", (version) => {
    let bb;
    let mcp;
    let s;
    beforeAll(async () => {
        bb = await startBitbucket(version);
        s = await bootstrap(bb.api);
        mcp = await setupMcpAgainst(bb);
    }, 420_000);
    afterAll(async () => {
        await mcp?.close();
        await bb?.stop();
    });
    test("list_forks returns data", async () => {
        const r = await callAndParse(mcp.client, "list_forks", {
            project: s.projectKey,
            repository: s.repoSlug,
            limit: 1,
        });
        expect(typeof r.total).toBe("number");
    });
    test("fork_repository creates a fork", async () => {
        const forkName = "e2e-fork-" + Date.now();
        const r = await callAndParse(mcp.client, "fork_repository", { project: s.projectKey, repository: s.repoSlug, name: forkName });
        await bb.api.delete(`projects/${r.project.key}/repos/${r.slug}`);
    });
});
//# sourceMappingURL=forks.e2e.test.js.map