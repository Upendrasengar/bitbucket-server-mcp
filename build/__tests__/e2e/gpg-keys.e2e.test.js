import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { startBitbucket, } from "./bitbucket-container.js";
import { setupMcpAgainst } from "./mcp-harness.js";
import { callAndParse } from "../tool-test-utils.js";
import { SELECTED_VERSIONS } from "./versions.js";
describe.each(SELECTED_VERSIONS)("GPG keys: Bitbucket $name", (version) => {
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
    test("list_gpg_keys returns data", async () => {
        const r = await callAndParse(mcp.client, "list_gpg_keys", {});
        expect(typeof r.total).toBe("number");
        expect(Array.isArray(r.keys)).toBe(true);
    });
});
//# sourceMappingURL=gpg-keys.e2e.test.js.map