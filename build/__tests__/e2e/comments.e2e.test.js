import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { SELECTED_VERSIONS } from "./versions.js";
import { startBitbucket, } from "./bitbucket-container.js";
import { bootstrap } from "./bootstrap.js";
import { setupMcpAgainst } from "./mcp-harness.js";
import { callAndParse } from "../tool-test-utils.js";
describe.each(SELECTED_VERSIONS)("comments: Bitbucket $name", (version) => {
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
    test("manage_comment create adds a comment", async () => {
        const parsed = await callAndParse(mcp.client, "manage_comment", {
            action: "create",
            project: s.projectKey,
            repository: s.repoSlug,
            prId: s.prId,
            text: "E2E smoke test comment",
        });
        expect(parsed.id).toBeDefined();
        expect(parsed.text).toBe("E2E smoke test comment");
    });
    test("search_emoticons returns results", async () => {
        const parsed = await callAndParse(mcp.client, "search_emoticons", { query: "thumb" });
        expect(parsed.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=comments.e2e.test.js.map