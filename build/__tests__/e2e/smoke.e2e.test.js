import { describe, test, expect, beforeAll, afterAll } from "vitest";
import ky from "ky";
import { startBitbucket, } from "./bitbucket-container.js";
import { SELECTED_VERSIONS } from "./versions.js";
/**
 * Smoke tier: for every declared version, confirm the healthcheck
 * endpoint shape and the error shape are stable. These are the two
 * contracts the MCP relies on to diagnose connectivity problems and to
 * surface server messages, and Atlassian has changed their
 * documentation around them more than once.
 */
describe.each(SELECTED_VERSIONS)("smoke: Bitbucket $name", (version) => {
    let bb;
    beforeAll(async () => {
        bb = await startBitbucket(version);
    }, 420_000);
    afterAll(async () => {
        await bb?.stop();
    });
    test("GET /application-properties returns a parseable version", async () => {
        const res = await ky
            .get(`${bb.url}/rest/api/1.0/application-properties`, {
            headers: { Accept: "application/json" },
        })
            .json();
        expect(res.version).toMatch(/^\d+\.\d+(\.\d+)?$/);
        expect(res.displayName).toBe("Bitbucket");
        expect(res.version.startsWith(version.name)).toBe(true);
    });
    test("unauthenticated call returns the Bitbucket error shape", async () => {
        // `/dashboard/pull-requests` requires a user context (no anonymous
        // view), so without credentials it returns 401 with the canonical
        // `{errors:[{message,exceptionName}]}` body that `handleToolError`
        // unpacks. `/projects` is not usable for this check: some
        // configurations return 200 with an empty list when anonymous
        // access is permitted.
        const res = await ky.get(`${bb.url}/rest/api/1.0/dashboard/pull-requests`, {
            headers: { Accept: "application/json" },
            throwHttpErrors: false,
        });
        expect(res.status).toBe(401);
        const body = (await res.json());
        expect(Array.isArray(body.errors)).toBe(true);
        expect(body.errors.length).toBeGreaterThan(0);
        expect(typeof body.errors[0].message).toBe("string");
    });
});
//# sourceMappingURL=smoke.e2e.test.js.map