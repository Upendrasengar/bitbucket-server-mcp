import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { startBitbucket, } from "./bitbucket-container.js";
import { bootstrap } from "./bootstrap.js";
import { setupMcpAgainst } from "./mcp-harness.js";
import { callAndParse } from "../tool-test-utils.js";
import { SELECTED_VERSIONS } from "./versions.js";
describe.each(SELECTED_VERSIONS)("branch restrictions: Bitbucket $name", (version) => {
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
    test("list_branch_restrictions returns data", async () => {
        const r = await callAndParse(mcp.client, "list_branch_restrictions", { project: s.projectKey, repository: s.repoSlug });
        expect(typeof r.total).toBe("number");
        expect(Array.isArray(r.restrictions)).toBe(true);
    });
});
//# sourceMappingURL=branch-restrictions.e2e.test.js.map