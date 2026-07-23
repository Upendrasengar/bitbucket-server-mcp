import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { SELECTED_VERSIONS } from "./versions.js";
import { startBitbucket, } from "./bitbucket-container.js";
import { bootstrap } from "./bootstrap.js";
import { setupMcpAgainst } from "./mcp-harness.js";
import { callRaw } from "../tool-test-utils.js";
describe.each(SELECTED_VERSIONS)("insights: Bitbucket $name", (version) => {
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
    test("get_build_status returns result for a commit", async () => {
        const result = await callRaw(mcp.client, "get_build_status", {
            commitId: s.mainCommitId,
        });
        expect(result.isError).toBeFalsy();
    });
});
//# sourceMappingURL=insights.e2e.test.js.map