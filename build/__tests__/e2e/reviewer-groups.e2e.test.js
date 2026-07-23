import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { SELECTED_VERSIONS } from "./versions.js";
import { startBitbucket, } from "./bitbucket-container.js";
import { bootstrap } from "./bootstrap.js";
import { setupMcpAgainst } from "./mcp-harness.js";
import { callAndParse } from "../tool-test-utils.js";
describe.each(SELECTED_VERSIONS)("reviewer-groups: Bitbucket $name", (version) => {
    let bb;
    let mcp;
    let scenario;
    beforeAll(async () => {
        bb = await startBitbucket(version);
        scenario = await bootstrap(bb.api);
        mcp = await setupMcpAgainst(bb);
    }, 420_000);
    afterAll(async () => {
        await mcp?.close();
        await bb?.stop();
    });
    test("list_reviewer_groups returns empty list initially", async () => {
        const parsed = await callAndParse(mcp.client, "list_reviewer_groups", {
            project: scenario.projectKey,
            repository: scenario.repoSlug,
        });
        expect(Array.isArray(parsed)).toBe(true);
    });
});
//# sourceMappingURL=reviewer-groups.e2e.test.js.map