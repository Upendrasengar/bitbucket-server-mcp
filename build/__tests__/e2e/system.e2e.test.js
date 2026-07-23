import { callRaw } from "../tool-test-utils.js";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { SELECTED_VERSIONS } from "./versions.js";
import { startBitbucket, } from "./bitbucket-container.js";
import { setupMcpAgainst } from "./mcp-harness.js";
describe.each(SELECTED_VERSIONS)("system: Bitbucket $name", (version) => {
    let bb;
    let mcp;
    beforeAll(async () => {
        bb = await startBitbucket(version);
        mcp = await setupMcpAgainst(bb);
    }, 420_000);
    afterAll(async () => {
        await mcp?.close();
        await bb?.stop();
    });
    test("get_server_info returns version", async () => {
        const result = await callRaw(mcp.client, "get_server_info", {});
        const content = result.content;
        const parsed = JSON.parse(content[0].text);
        expect(parsed.version).toBeDefined();
        expect(parsed.buildNumber).toBeDefined();
    });
});
//# sourceMappingURL=system.e2e.test.js.map