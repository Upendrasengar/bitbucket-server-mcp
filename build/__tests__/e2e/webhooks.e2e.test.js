import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { startBitbucket, } from "./bitbucket-container.js";
import { bootstrap } from "./bootstrap.js";
import { setupMcpAgainst } from "./mcp-harness.js";
import { callAndParse } from "../tool-test-utils.js";
import { SELECTED_VERSIONS } from "./versions.js";
describe.each(SELECTED_VERSIONS)("webhooks: Bitbucket $name", (version) => {
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
    test("list_webhooks returns data", async () => {
        const r = await callAndParse(mcp.client, "list_webhooks", { project: s.projectKey, repository: s.repoSlug });
        expect(typeof r.total).toBe("number");
    });
    test("manage_webhooks create and delete round-trip", async () => {
        const create = await callAndParse(mcp.client, "manage_webhooks", {
            action: "create",
            project: s.projectKey,
            repository: s.repoSlug,
            name: "e2e-hook-" + Date.now(),
            url: "https://example.com/hook",
            events: ["repo:refs_changed"],
        });
        const del = await callAndParse(mcp.client, "manage_webhooks", {
            action: "delete",
            project: s.projectKey,
            repository: s.repoSlug,
            webhookId: create.id,
        });
        expect(del.deleted).toBe(true);
    });
});
//# sourceMappingURL=webhooks.e2e.test.js.map