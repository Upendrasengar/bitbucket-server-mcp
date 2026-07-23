import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { SELECTED_VERSIONS, gte } from "./versions.js";
import { startBitbucket, } from "./bitbucket-container.js";
import { bootstrap } from "./bootstrap.js";
import { setupMcpAgainst } from "./mcp-harness.js";
import { callAndParse, callRaw } from "../tool-test-utils.js";
const SECRET_SCANNING_SINCE = "8.5";
const VERSIONS_WITH_SECRET_SCANNING = SELECTED_VERSIONS.filter((v) => gte(v, SECRET_SCANNING_SINCE));
const VERSIONS_WITHOUT_SECRET_SCANNING = SELECTED_VERSIONS.filter((v) => !gte(v, SECRET_SCANNING_SINCE));
describe.each(VERSIONS_WITH_SECRET_SCANNING)("secret-scanning supported: Bitbucket $name", (version) => {
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
    test("list_secret_scanning_rules returns rules", async () => {
        const parsed = await callAndParse(mcp.client, "list_secret_scanning_rules", {
            project: scenario.projectKey,
            repository: scenario.repoSlug,
        });
        expect(Array.isArray(parsed)).toBe(true);
    });
});
describe.each(VERSIONS_WITHOUT_SECRET_SCANNING)("secret-scanning unsupported: Bitbucket $name", (version) => {
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
    test("list_secret_scanning_rules returns error", async () => {
        const result = await callRaw(mcp.client, "list_secret_scanning_rules", {
            project: scenario.projectKey,
            repository: scenario.repoSlug,
        });
        expect(result.isError).toBe(true);
    });
});
//# sourceMappingURL=secret-scanning.e2e.test.js.map