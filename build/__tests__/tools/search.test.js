var __addDisposableResource = (this && this.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (this && this.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r, s = 0;
        function next() {
            while (r = env.stack.pop()) {
                try {
                    if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                    if (r.dispose) {
                        var result = r.dispose.call(r.value);
                        if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                    }
                    else s |= 1;
                }
                catch (e) {
                    fail(e);
                }
            }
            if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
import { describe, test, expect } from "vitest";
import { registerSearchTools } from "../../tools/search.js";
import { mockJson, mockError } from "../test-utils.js";
import { callAndParse, callRaw, connectMcp, createTestToolContext, setupToolHarness, } from "../tool-test-utils.js";
describe("Search tools", () => {
    const h = setupToolHarness({
        register: registerSearchTools,
        defaultProject: "DEFAULT",
    });
    describe("search", () => {
        test("should search with a plain query", async () => {
            const mockResponse = {
                code: {
                    values: [{ file: "src/index.ts", hitCount: 3 }],
                    isLastPage: true,
                    count: 1,
                },
            };
            mockJson(h.mockClients.search.post, mockResponse);
            const parsed = await callAndParse(h.client, "search", { query: "createClient" });
            expect(parsed.values).toHaveLength(1);
            expect(parsed.values[0].file).toBe("src/index.ts");
            expect(h.mockClients.search.post).toHaveBeenCalledWith("search", {
                json: {
                    query: "createClient",
                    entities: { code: { start: 0, limit: 25 } },
                },
            });
        });
        test("should prepend project filter when project is provided", async () => {
            mockJson(h.mockClients.search.post, {
                code: { values: [], isLastPage: true },
            });
            await h.client.callTool({
                name: "search",
                arguments: { query: "TODO", project: "MYPROJ" },
            });
            expect(h.mockClients.search.post).toHaveBeenCalledWith("search", {
                json: {
                    query: "project:MYPROJ TODO",
                    entities: { code: { start: 0, limit: 25 } },
                },
            });
        });
        test("should prepend repo filter when repository is provided", async () => {
            mockJson(h.mockClients.search.post, {
                code: { values: [], isLastPage: true },
            });
            await h.client.callTool({
                name: "search",
                arguments: { query: "TODO", project: "MYPROJ", repository: "my-repo" },
            });
            expect(h.mockClients.search.post).toHaveBeenCalledWith("search", {
                json: {
                    query: "repo:MYPROJ/my-repo TODO",
                    entities: { code: { start: 0, limit: 25 } },
                },
            });
        });
        test("should use default project for repo filter when project is not provided", async () => {
            mockJson(h.mockClients.search.post, {
                code: { values: [], isLastPage: true },
            });
            await h.client.callTool({
                name: "search",
                arguments: { query: "TODO", repository: "my-repo" },
            });
            expect(h.mockClients.search.post).toHaveBeenCalledWith("search", {
                json: {
                    query: "repo:DEFAULT/my-repo TODO",
                    entities: { code: { start: 0, limit: 25 } },
                },
            });
        });
        test("should wrap query in quotes when type is file", async () => {
            mockJson(h.mockClients.search.post, {
                code: { values: [], isLastPage: true },
            });
            await h.client.callTool({
                name: "search",
                arguments: { query: "index.ts", type: "file" },
            });
            expect(h.mockClients.search.post).toHaveBeenCalledWith("search", {
                json: {
                    query: '"index.ts"',
                    entities: { code: { start: 0, limit: 25 } },
                },
            });
        });
        test("should apply both repo filter and file type together", async () => {
            mockJson(h.mockClients.search.post, {
                code: { values: [], isLastPage: true },
            });
            await h.client.callTool({
                name: "search",
                arguments: {
                    query: "config.yaml",
                    project: "PROJ",
                    repository: "svc",
                    type: "file",
                },
            });
            expect(h.mockClients.search.post).toHaveBeenCalledWith("search", {
                json: {
                    query: '"repo:PROJ/svc config.yaml"',
                    entities: { code: { start: 0, limit: 25 } },
                },
            });
        });
        test("should pass custom limit and start", async () => {
            mockJson(h.mockClients.search.post, {
                code: { values: [], isLastPage: true },
            });
            await h.client.callTool({
                name: "search",
                arguments: { query: "test", limit: 50, start: 10 },
            });
            expect(h.mockClients.search.post).toHaveBeenCalledWith("search", {
                json: { query: "test", entities: { code: { start: 10, limit: 50 } } },
            });
        });
        test("should curate response fields by default", async () => {
            mockJson(h.mockClients.search.post, {
                code: {
                    values: [
                        {
                            file: "src/index.ts",
                            hitCount: 2,
                            hitContexts: [[{ line: 1, text: "const x = 1;" }]],
                            pathMatches: [{ text: "src/index.ts", match: false }],
                            repository: {
                                slug: "my-repo",
                                name: "My Repo",
                                scmId: "git",
                                hierarchyId: "h2",
                                project: { key: "PROJ", id: 1 },
                            },
                        },
                    ],
                    isLastPage: true,
                },
            });
            const parsed = await callAndParse(h.client, "search", { query: "const" });
            const item = parsed.values[0];
            expect(item.file).toBe("src/index.ts");
            expect(item.hitContexts).toEqual([[{ line: 1, text: "const x = 1;" }]]);
            expect(item.repository.slug).toBe("my-repo");
            expect(item.repository.scmId).toBeUndefined();
            expect(item.repository.hierarchyId).toBeUndefined();
            expect(item.repository.project.key).toBe("PROJ");
            expect(item.repository.project.id).toBeUndefined();
        });
        test("should return all fields when fields='*all'", async () => {
            mockJson(h.mockClients.search.post, {
                code: {
                    values: [
                        {
                            file: "src/index.ts",
                            hitCount: 1,
                            hitContexts: [],
                            pathMatches: [],
                            repository: { slug: "my-repo", hierarchyId: "h2", scmId: "git" },
                        },
                    ],
                    isLastPage: true,
                },
            });
            const parsed = await callAndParse(h.client, "search", { query: "const", fields: "*all" });
            const item = parsed.values[0];
            expect(item.repository.hierarchyId).toBe("h2");
            expect(item.repository.scmId).toBe("git");
        });
        test("should handle errors", async () => {
            mockError(h.mockClients.search.post, new Error("Network error"));
            const result = await callRaw(h.client, "search", { query: "test" });
            expect(result.isError).toBe(true);
        });
        test.each([
            { limit: 1, start: 0 },
            { limit: 1, start: 0 },
            { limit: 100, start: 1000 },
        ])("forwards pagination params limit=$limit start=$start", async ({ limit, start }) => {
            mockJson(h.mockClients.search.post, {
                code: { values: [], isLastPage: true },
            });
            await h.client.callTool({
                name: "search",
                arguments: { query: "q", limit, start },
            });
            expect(h.mockClients.search.post).toHaveBeenCalledWith("search", {
                json: {
                    query: "q",
                    entities: { code: { start, limit } },
                },
            });
        });
        test("should throw when repository provided but no project and no default", async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const ctx = createTestToolContext({ defaultProject: undefined });
                registerSearchTools(ctx);
                const conn = __addDisposableResource(env_1, await connectMcp(ctx.server), true);
                const result = await conn.client.callTool({
                    name: "search",
                    arguments: { query: "q", repository: "r" },
                });
                expect(result.isError).toBe(true);
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                const result_1 = __disposeResources(env_1);
                if (result_1)
                    await result_1;
            }
        });
    });
});
//# sourceMappingURL=search.test.js.map