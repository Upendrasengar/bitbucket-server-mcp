import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { startBitbucket, } from "./bitbucket-container.js";
import { bootstrap } from "./bootstrap.js";
import { setupMcpAgainst } from "./mcp-harness.js";
import { callAndParse } from "../tool-test-utils.js";
import { SELECTED_VERSIONS } from "./versions.js";
describe.each(SELECTED_VERSIONS)("repositories: Bitbucket $name", (version) => {
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
    test("create_repository and delete_repository round-trip", async () => {
        const repoName = "e2e-repo-" + Date.now();
        const create = await callAndParse(mcp.client, "create_repository", { project: s.projectKey, name: repoName });
        expect(create.slug).toBe(repoName);
        const del = await callAndParse(mcp.client, "delete_repository", { project: s.projectKey, repository: repoName });
        expect(del.deleted).toBe(true);
    });
});
//# sourceMappingURL=repositories.e2e.test.js.map