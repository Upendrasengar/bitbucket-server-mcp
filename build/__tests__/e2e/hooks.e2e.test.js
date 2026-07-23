import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { SELECTED_VERSIONS } from "./versions.js";
import { startBitbucket, } from "./bitbucket-container.js";
import { bootstrap } from "./bootstrap.js";
import { setupMcpAgainst } from "./mcp-harness.js";
import { callAndParse } from "../tool-test-utils.js";
describe.each(SELECTED_VERSIONS)("hooks: Bitbucket $name", (version) => {
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
    test("manage_repository_hooks enable flips a bundled hook", async () => {
        const parsed = await callAndParse(mcp.client, "manage_repository_hooks", {
            action: "enable",
            project: scenario.projectKey,
            repository: scenario.repoSlug,
            hookKey: "com.atlassian.bitbucket.server.bitbucket-bundled-hooks:force-push-hook",
        });
        expect(parsed.enabled).toBe(true);
    });
    test("manage_repository_hooks disable flips it back", async () => {
        const parsed = await callAndParse(mcp.client, "manage_repository_hooks", {
            action: "disable",
            project: scenario.projectKey,
            repository: scenario.repoSlug,
            hookKey: "com.atlassian.bitbucket.server.bitbucket-bundled-hooks:force-push-hook",
        });
        expect(parsed.enabled).toBe(false);
    });
});
//# sourceMappingURL=hooks.e2e.test.js.map