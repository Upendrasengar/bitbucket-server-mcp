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
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../server.js";
async function connectServer(options) {
    const { server } = createServer({
        baseUrl: "http://localhost",
        token: "fake",
        ...options,
    });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
    await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
    ]);
    return {
        client,
        async [Symbol.asyncDispose]() {
            await client.close();
            await serverTransport.close();
            await server.close?.();
        },
    };
}
async function listToolsOrEmpty(client) {
    try {
        const { tools } = await client.listTools();
        return tools.map((t) => t.name);
    }
    catch (err) {
        let message = "";
        if (err instanceof Error)
            message = err.message;
        else if (typeof err === "string")
            message = err;
        const code = err.code;
        if (code === -32601 || /method not found/i.test(message)) {
            return [];
        }
        throw err;
    }
}
describe("readOnly mode", () => {
    test("should exclude write tools", async () => {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const conn = __addDisposableResource(env_1, await connectServer({ readOnly: true }), true);
            const { tools } = await conn.client.listTools();
            const names = tools.map((t) => t.name);
            expect(names).toContain("list_projects");
            expect(names).toContain("get_pull_request");
            expect(names).toContain("get_diff");
            expect(names).toContain("search");
            expect(names).not.toContain("create_pull_request");
            expect(names).not.toContain("update_pull_request");
            expect(names).not.toContain("merge_pull_request");
            expect(names).not.toContain("decline_pull_request");
            expect(names).not.toContain("manage_comment");
            expect(names).not.toContain("manage_review");
            expect(names).not.toContain("manage_branches");
            expect(names).not.toContain("upload_attachment");
            expect(names).not.toContain("edit_file");
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
describe("enabledTools filter", () => {
    test("should only register the specified tools", async () => {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            const conn = __addDisposableResource(env_2, await connectServer({
                enabledTools: ["list_projects", "get_pull_request", "search"],
            }), true);
            const { tools } = await conn.client.listTools();
            const names = tools.map((t) => t.name);
            expect(names).toEqual(expect.arrayContaining(["list_projects", "get_pull_request", "search"]));
            expect(names).toHaveLength(3);
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            const result_2 = __disposeResources(env_2);
            if (result_2)
                await result_2;
        }
    });
});
describe("default mode (no readOnly, no enabledTools)", () => {
    test("registers all tools including write ones", async () => {
        const env_3 = { stack: [], error: void 0, hasError: false };
        try {
            const conn = __addDisposableResource(env_3, await connectServer({}), true);
            const { tools } = await conn.client.listTools();
            const names = tools.map((t) => t.name);
            expect(names).toContain("list_projects");
            expect(names).toContain("get_pull_request");
            expect(names).toContain("create_pull_request");
            expect(names).toContain("update_pull_request");
            expect(names).toContain("merge_pull_request");
            expect(names).toContain("decline_pull_request");
            expect(names).toContain("manage_comment");
            expect(names).toContain("manage_review");
            expect(names).toContain("manage_branches");
            expect(names).toContain("upload_attachment");
            expect(names).toContain("edit_file");
        }
        catch (e_3) {
            env_3.error = e_3;
            env_3.hasError = true;
        }
        finally {
            const result_3 = __disposeResources(env_3);
            if (result_3)
                await result_3;
        }
    });
});
describe("readOnly + enabledTools combined (decision table)", () => {
    test.each([
        {
            name: "readOnly=true + enabledTools read-only subset",
            options: {
                readOnly: true,
                enabledTools: ["list_projects", "search"],
            },
            expected: ["list_projects", "search"],
        },
        {
            name: "readOnly=true + enabledTools mix (filters out write)",
            options: {
                readOnly: true,
                enabledTools: ["list_projects", "create_pull_request", "search"],
            },
            expected: ["list_projects", "search"],
        },
        {
            name: "readOnly=false + enabledTools with write tools",
            options: {
                readOnly: false,
                enabledTools: ["create_pull_request", "merge_pull_request"],
            },
            expected: ["create_pull_request", "merge_pull_request"],
        },
    ])("$name", async ({ options, expected }) => {
        const env_4 = { stack: [], error: void 0, hasError: false };
        try {
            const conn = __addDisposableResource(env_4, await connectServer(options), true);
            const { tools } = await conn.client.listTools();
            const names = tools.map((t) => t.name).sort();
            expect(names).toEqual(expected.sort());
        }
        catch (e_4) {
            env_4.error = e_4;
            env_4.hasError = true;
        }
        finally {
            const result_4 = __disposeResources(env_4);
            if (result_4)
                await result_4;
        }
    });
    test("readOnly=true + only-write enabledTools exposes no tools", async () => {
        const env_5 = { stack: [], error: void 0, hasError: false };
        try {
            const conn = __addDisposableResource(env_5, await connectServer({
                readOnly: true,
                enabledTools: ["create_pull_request", "merge_pull_request"],
            }), true);
            const toolNames = await listToolsOrEmpty(conn.client);
            expect(toolNames).toEqual([]);
        }
        catch (e_5) {
            env_5.error = e_5;
            env_5.hasError = true;
        }
        finally {
            const result_5 = __disposeResources(env_5);
            if (result_5)
                await result_5;
        }
    });
});
describe("server identity", () => {
    test("server name is bitbucket-server-mcp", async () => {
        const env_6 = { stack: [], error: void 0, hasError: false };
        try {
            const conn = __addDisposableResource(env_6, await connectServer({}), true);
            const info = await conn.client.getServerVersion();
            expect(info?.name).toBe("bitbucket-server-mcp");
        }
        catch (e_6) {
            env_6.error = e_6;
            env_6.hasError = true;
        }
        finally {
            const result_6 = __disposeResources(env_6);
            if (result_6)
                await result_6;
        }
    });
    test("server exposes instructions with workflow tips", async () => {
        const env_7 = { stack: [], error: void 0, hasError: false };
        try {
            const conn = __addDisposableResource(env_7, await connectServer({}), true);
            const instructions = await conn.client.getInstructions();
            expect(instructions).toBeDefined();
            expect(instructions.length).toBeGreaterThan(100);
            expect(instructions).toContain("list_projects");
            expect(instructions).toContain("manage_comment");
            expect(instructions).toContain("manage_review");
            expect(instructions).toContain("BITBUCKET_DEFAULT_PROJECT");
        }
        catch (e_7) {
            env_7.error = e_7;
            env_7.hasError = true;
        }
        finally {
            const result_7 = __disposeResources(env_7);
            if (result_7)
                await result_7;
        }
    });
});
//# sourceMappingURL=tool-filtering.test.js.map