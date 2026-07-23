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
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, test, expect } from "vitest";
import { registerRepositoryTools } from "../../tools/repositories.js";
import { mockError, mockJson, mockReject } from "../test-utils.js";
import { callAndParse, callAndParseFull, callRaw, expectCalledWith, expectCalledWithSearchParams, setupToolHarness, } from "../tool-test-utils.js";
async function tempDir() {
    const path = await mkdtemp(join(tmpdir(), "bitbucket-mcp-test-"));
    return {
        path,
        async [Symbol.asyncDispose]() {
            await rm(path, { recursive: true, force: true });
        },
    };
}
describe("Repository tools", () => {
    const h = setupToolHarness({
        register: registerRepositoryTools,
        defaultProject: "DEFAULT",
    });
    describe("list_projects", () => {
        test("should list projects with pagination", async () => {
            const mockResponse = {
                values: [
                    {
                        key: "PROJ",
                        name: "Project",
                        description: "Test",
                        public: false,
                        type: "NORMAL",
                    },
                ],
                size: 1,
                isLastPage: true,
            };
            mockJson(h.mockClients.api.get, mockResponse);
            const parsed = await callAndParse(h.client, "list_projects", { limit: 10 });
            expect(parsed.total).toBe(1);
            expect(parsed.projects).toHaveLength(1);
            expect(parsed.projects[0].key).toBe("PROJ");
        });
        test("should return curated output with default fields", async () => {
            const mockResponse = {
                values: [
                    {
                        key: "PROJ",
                        id: 1,
                        name: "Project",
                        description: "Test",
                        public: false,
                        type: "NORMAL",
                        links: { self: [{ href: "http://example.com" }] },
                        extraField: "should be removed",
                    },
                ],
                size: 1,
                isLastPage: true,
            };
            mockJson(h.mockClients.api.get, mockResponse);
            const parsed = await callAndParse(h.client, "list_projects", {});
            const project = parsed.projects[0];
            expect(project.key).toBe("PROJ");
            expect(project.name).toBe("Project");
            expect(project).not.toHaveProperty("links");
            expect(project).not.toHaveProperty("extraField");
        });
    });
    describe("list_repositories", () => {
        test("should list repositories for a project", async () => {
            const mockResponse = {
                values: [
                    {
                        slug: "my-repo",
                        name: "My Repo",
                        project: { key: "TEST" },
                        state: "AVAILABLE",
                    },
                ],
                size: 1,
                isLastPage: true,
            };
            mockJson(h.mockClients.api.get, mockResponse);
            const parsed = await callAndParse(h.client, "list_repositories", { project: "TEST" });
            expect(parsed.repositories).toHaveLength(1);
            expect(parsed.repositories[0].slug).toBe("my-repo");
        });
        test("should use default project when not provided", async () => {
            mockJson(h.mockClients.api.get, {
                values: [],
                size: 0,
                isLastPage: true,
            });
            await callAndParse(h.client, "list_repositories", {});
            expect(h.mockClients.api.get).toHaveBeenCalledWith("projects/DEFAULT/repos", expect.anything());
        });
    });
    describe("browse_repository", () => {
        test("should browse root directory", async () => {
            mockJson(h.mockClients.api.get, {
                children: {
                    values: [
                        { path: { toString: "src" }, type: "DIRECTORY" },
                        { path: { toString: "README.md" }, type: "FILE" },
                    ],
                    size: 2,
                },
            });
            const result = await callRaw(h.client, "browse_repository", { project: "TEST", repository: "my-repo" });
            const content = result.content;
            expect(content[0].type).toBe("text");
        });
        test("should browse a specific path", async () => {
            mockJson(h.mockClients.api.get, {
                children: {
                    values: [{ path: { toString: "index.ts" }, type: "FILE" }],
                    size: 1,
                },
            });
            await h.client.callTool({
                name: "browse_repository",
                arguments: { project: "TEST", repository: "my-repo", path: "src" },
            });
            expect(h.mockClients.api.get).toHaveBeenCalledWith("projects/TEST/repos/my-repo/browse/src", expect.anything());
        });
        test("should pass branch as 'at' search param", async () => {
            mockJson(h.mockClients.api.get, {
                children: { values: [], size: 0 },
            });
            await h.client.callTool({
                name: "browse_repository",
                arguments: {
                    project: "TEST",
                    repository: "my-repo",
                    branch: "develop",
                },
            });
            expectCalledWithSearchParams(h.mockClients.api.get, "projects/TEST/repos/my-repo/browse", { at: "develop" });
        });
        test("should use default project when not provided", async () => {
            mockJson(h.mockClients.api.get, { children: { values: [], size: 0 } });
            await h.client.callTool({
                name: "browse_repository",
                arguments: { repository: "my-repo" },
            });
            expect(h.mockClients.api.get).toHaveBeenCalledWith("projects/DEFAULT/repos/my-repo/browse", expect.anything());
        });
        test("should handle errors gracefully", async () => {
            mockError(h.mockClients.api.get, new Error("Not Found"));
            const result = await callRaw(h.client, "browse_repository", {
                project: "TEST",
                repository: "nonexistent",
            });
            expect(result.isError).toBe(true);
        });
        test("should pass custom limit as searchParam", async () => {
            mockJson(h.mockClients.api.get, { children: { values: [], size: 0 } });
            await h.client.callTool({
                name: "browse_repository",
                arguments: { project: "TEST", repository: "r", limit: 200 },
            });
            expectCalledWithSearchParams(h.mockClients.api.get, "projects/TEST/repos/r/browse", { limit: 200 });
        });
        test("should not include 'at' when branch is omitted", async () => {
            mockJson(h.mockClients.api.get, { children: { values: [], size: 0 } });
            await h.client.callTool({
                name: "browse_repository",
                arguments: { project: "TEST", repository: "r" },
            });
            const [, opts] = h.mockClients.api.get.mock.calls[0];
            expect(opts.searchParams).not.toHaveProperty("at");
        });
    });
    describe("upload_attachment", () => {
        test("should upload a local file and return image markdown reference", async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const tmp = __addDisposableResource(env_1, await tempDir(), true);
                await writeFile(join(tmp.path, "screenshot.png"), "fake-png-content");
                const mockResponse = {
                    attachments: [
                        {
                            id: 3,
                            url: "http://bitbucket.example.com/projects/TEST/repos/my-repo/attachments/3",
                            links: {
                                self: {
                                    href: "http://bitbucket.example.com/projects/TEST/repos/my-repo/attachments/3",
                                },
                                attachment: { href: "attachment:1/3" },
                            },
                        },
                    ],
                };
                mockJson(h.mockClients.api.post, mockResponse);
                const { result, parsed } = await callAndParseFull(h.client, "upload_attachment", {
                    project: "TEST",
                    repository: "my-repo",
                    filePath: join(tmp.path, "screenshot.png"),
                });
                expect(result.isError).toBeFalsy();
                expect(parsed.id).toBe(3);
                expect(parsed.markdown).toBe("![screenshot.png](attachment:1/3)");
                expectCalledWith(h.mockClients.api.post, "projects/TEST/repos/my-repo/attachments", { body: expect.any(FormData) });
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
        test("should use link markdown for non-image files", async () => {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const tmp = __addDisposableResource(env_2, await tempDir(), true);
                await writeFile(join(tmp.path, "report.pdf"), "fake-pdf-content");
                const mockResponse = {
                    attachments: [
                        {
                            id: 5,
                            url: "http://bitbucket.example.com/attachments/5",
                            links: {
                                self: { href: "http://bitbucket.example.com/attachments/5" },
                                attachment: { href: "attachment:1/5" },
                            },
                        },
                    ],
                };
                mockJson(h.mockClients.api.post, mockResponse);
                const parsed = await callAndParse(h.client, "upload_attachment", {
                    project: "TEST",
                    repository: "my-repo",
                    filePath: join(tmp.path, "report.pdf"),
                });
                expect(parsed.markdown).toBe("[report.pdf](attachment:1/5)");
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
        describe("image extension equivalence classes", () => {
            const imageExts = ["jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"];
            const nonImageExts = ["txt", "zip", "tar", "doc", "xls"];
            const attachmentResponse = (id) => ({
                attachments: [
                    {
                        id,
                        url: `http://bb.example.com/att/${id}`,
                        links: {
                            self: { href: `http://bb.example.com/att/${id}` },
                            attachment: { href: `attachment:1/${id}` },
                        },
                    },
                ],
            });
            test.each(imageExts)(".%s produces image markdown ![...](...)", async (ext) => {
                const env_3 = { stack: [], error: void 0, hasError: false };
                try {
                    const tmp = __addDisposableResource(env_3, await tempDir(), true);
                    const fileName = `photo.${ext}`;
                    await writeFile(join(tmp.path, fileName), "img");
                    mockJson(h.mockClients.api.post, attachmentResponse(1));
                    const parsed = await callAndParse(h.client, "upload_attachment", {
                        project: "TEST",
                        repository: "my-repo",
                        filePath: join(tmp.path, fileName),
                    });
                    expect(parsed.markdown).toMatch(/^!\[/);
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
            test.each(nonImageExts)(".%s produces link markdown [...](...)", async (ext) => {
                const env_4 = { stack: [], error: void 0, hasError: false };
                try {
                    const tmp = __addDisposableResource(env_4, await tempDir(), true);
                    const fileName = `file.${ext}`;
                    await writeFile(join(tmp.path, fileName), "data");
                    mockJson(h.mockClients.api.post, attachmentResponse(2));
                    const parsed = await callAndParse(h.client, "upload_attachment", {
                        project: "TEST",
                        repository: "my-repo",
                        filePath: join(tmp.path, fileName),
                    });
                    expect(parsed.markdown).toMatch(/^\[/);
                    expect(parsed.markdown).not.toMatch(/^!\[/);
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
            test("filename without extension (no dot) produces link markdown", async () => {
                const env_5 = { stack: [], error: void 0, hasError: false };
                try {
                    const tmp = __addDisposableResource(env_5, await tempDir(), true);
                    await writeFile(join(tmp.path, "Makefile"), "all:");
                    mockJson(h.mockClients.api.post, attachmentResponse(10));
                    const parsed = await callAndParse(h.client, "upload_attachment", {
                        project: "TEST",
                        repository: "my-repo",
                        filePath: join(tmp.path, "Makefile"),
                    });
                    expect(parsed.markdown).toMatch(/^\[/);
                    expect(parsed.markdown).not.toMatch(/^!\[/);
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
            test("filename ending with .pngX (not a real image ext) produces link markdown", async () => {
                const env_6 = { stack: [], error: void 0, hasError: false };
                try {
                    const tmp = __addDisposableResource(env_6, await tempDir(), true);
                    await writeFile(join(tmp.path, "fake.pngx"), "data");
                    mockJson(h.mockClients.api.post, attachmentResponse(11));
                    const parsed = await callAndParse(h.client, "upload_attachment", {
                        project: "TEST",
                        repository: "my-repo",
                        filePath: join(tmp.path, "fake.pngx"),
                    });
                    expect(parsed.markdown).toMatch(/^\[/);
                    expect(parsed.markdown).not.toMatch(/^!\[/);
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
        });
    });
    describe("edit_file", () => {
        const commitResponse = {
            id: "abc123def456",
            displayId: "abc123d",
            message: "Edit README.md",
            author: { name: "admin", emailAddress: "admin@example.com" },
            committer: { name: "admin", emailAddress: "admin@example.com" },
            authorTimestamp: 1680000000000,
            committerTimestamp: 1680000000000,
            parents: [{ id: "parent123", displayId: "parent12" }],
        };
        test("should edit a file with all required params", async () => {
            mockJson(h.mockClients.api.put, commitResponse);
            const parsed = await callAndParse(h.client, "edit_file", {
                project: "TEST",
                repository: "my-repo",
                filePath: "README.md",
                branch: "main",
                content: "new content",
                message: "Edit README.md",
            });
            expect(parsed.id).toBe("abc123def456");
            expect(parsed.displayId).toBe("abc123d");
            const [url, opts] = h.mockClients.api.put.mock.calls[0];
            expect(url).toBe("projects/TEST/repos/my-repo/browse/README.md");
            const fd = opts.body;
            const entries = {};
            fd.forEach((value, key) => {
                entries[key] = value;
            });
            expect(entries.branch).toBe("main");
            expect(entries.content).toBe("new content");
            expect(entries.message).toBe("Edit README.md");
            expect(entries).not.toHaveProperty("sourceCommitId");
            expect(entries).not.toHaveProperty("sourceBranch");
        });
        test("should use default project when not provided", async () => {
            mockJson(h.mockClients.api.put, commitResponse);
            await h.client.callTool({
                name: "edit_file",
                arguments: {
                    repository: "my-repo",
                    filePath: "file.txt",
                    branch: "main",
                    content: "data",
                    message: "msg",
                },
            });
            const [url] = h.mockClients.api.put.mock.calls[0];
            expect(url).toBe("projects/DEFAULT/repos/my-repo/browse/file.txt");
        });
        describe("sourceCommitId x sourceBranch decision table", () => {
            test("both omitted: only required fields in FormData", async () => {
                mockJson(h.mockClients.api.put, commitResponse);
                await h.client.callTool({
                    name: "edit_file",
                    arguments: {
                        project: "TEST",
                        repository: "r",
                        filePath: "f.txt",
                        branch: "b",
                        content: "c",
                        message: "m",
                    },
                });
                const [, opts] = h.mockClients.api.put.mock.calls[0];
                const keys = new Set();
                opts.body.forEach((_, key) => keys.add(key));
                expect(keys.has("sourceCommitId")).toBe(false);
                expect(keys.has("sourceBranch")).toBe(false);
                expect(keys.has("branch")).toBe(true);
                expect(keys.has("content")).toBe(true);
                expect(keys.has("message")).toBe(true);
            });
            test("sourceCommitId provided: included in FormData", async () => {
                mockJson(h.mockClients.api.put, commitResponse);
                await h.client.callTool({
                    name: "edit_file",
                    arguments: {
                        project: "TEST",
                        repository: "r",
                        filePath: "f.txt",
                        branch: "b",
                        content: "c",
                        message: "m",
                        sourceCommitId: "abc123",
                    },
                });
                const [, opts] = h.mockClients.api.put.mock.calls[0];
                const entries = {};
                opts.body.forEach((value, key) => {
                    entries[key] = value;
                });
                expect(entries.sourceCommitId).toBe("abc123");
                expect(entries).not.toHaveProperty("sourceBranch");
            });
            test("sourceBranch provided: included in FormData", async () => {
                mockJson(h.mockClients.api.put, commitResponse);
                await h.client.callTool({
                    name: "edit_file",
                    arguments: {
                        project: "TEST",
                        repository: "r",
                        filePath: "f.txt",
                        branch: "b",
                        content: "c",
                        message: "m",
                        sourceBranch: "develop",
                    },
                });
                const [, opts] = h.mockClients.api.put.mock.calls[0];
                const entries = {};
                opts.body.forEach((value, key) => {
                    entries[key] = value;
                });
                expect(entries.sourceBranch).toBe("develop");
                expect(entries).not.toHaveProperty("sourceCommitId");
            });
            test("both provided: both in FormData", async () => {
                mockJson(h.mockClients.api.put, commitResponse);
                await h.client.callTool({
                    name: "edit_file",
                    arguments: {
                        project: "TEST",
                        repository: "r",
                        filePath: "f.txt",
                        branch: "b",
                        content: "c",
                        message: "m",
                        sourceCommitId: "abc123",
                        sourceBranch: "develop",
                    },
                });
                const [, opts] = h.mockClients.api.put.mock.calls[0];
                const entries = {};
                opts.body.forEach((value, key) => {
                    entries[key] = value;
                });
                expect(entries.sourceCommitId).toBe("abc123");
                expect(entries.sourceBranch).toBe("develop");
            });
        });
        describe("content partitions", () => {
            test("empty content is sent as empty string", async () => {
                mockJson(h.mockClients.api.put, commitResponse);
                await h.client.callTool({
                    name: "edit_file",
                    arguments: {
                        project: "TEST",
                        repository: "r",
                        filePath: "f.txt",
                        branch: "b",
                        content: "",
                        message: "clear",
                    },
                });
                const [, opts] = h.mockClients.api.put.mock.calls[0];
                const entries = {};
                opts.body.forEach((value, key) => {
                    entries[key] = value;
                });
                expect(entries.content).toBe("");
            });
            test("unicode and emoji content is preserved", async () => {
                mockJson(h.mockClients.api.put, commitResponse);
                const content = "line1\nline2\n\tindented\n⭐";
                await h.client.callTool({
                    name: "edit_file",
                    arguments: {
                        project: "TEST",
                        repository: "r",
                        filePath: "f.txt",
                        branch: "b",
                        content,
                        message: "unicode",
                    },
                });
                const [, opts] = h.mockClients.api.put.mock.calls[0];
                const entries = {};
                opts.body.forEach((value, key) => {
                    entries[key] = value;
                });
                expect(entries.content).toBe(content);
            });
        });
        describe("filePath partitions", () => {
            test.each([
                { label: "root-level", path: "README.md" },
                { label: "nested", path: "src/lib/utils.ts" },
                { label: "with spaces", path: "my documents/notes.txt" },
                { label: "deeply nested", path: "a/b/c/d/e/f/g/file.txt" },
            ])("$label path is URL-embedded correctly", async ({ path }) => {
                mockJson(h.mockClients.api.put, commitResponse);
                await h.client.callTool({
                    name: "edit_file",
                    arguments: {
                        project: "TEST",
                        repository: "r",
                        filePath: path,
                        branch: "b",
                        content: "c",
                        message: "m",
                    },
                });
                const [url] = h.mockClients.api.put.mock.calls[0];
                expect(url).toBe(`projects/TEST/repos/r/browse/${path}`);
            });
        });
        describe("message partitions", () => {
            test("multiline message with body is preserved", async () => {
                mockJson(h.mockClients.api.put, commitResponse);
                const message = "feat: add feature\n\nDetailed description.";
                await h.client.callTool({
                    name: "edit_file",
                    arguments: {
                        project: "TEST",
                        repository: "r",
                        filePath: "f.txt",
                        branch: "b",
                        content: "c",
                        message,
                    },
                });
                const [, opts] = h.mockClients.api.put.mock.calls[0];
                const entries = {};
                opts.body.forEach((value, key) => {
                    entries[key] = value;
                });
                expect(entries.message).toBe(message);
            });
        });
        describe("error handling", () => {
            test("returns error on HTTP 404", async () => {
                mockReject(h.mockClients.api.put, new Error("Not Found"));
                const result = await callRaw(h.client, "edit_file", {
                    project: "TEST",
                    repository: "nonexistent",
                    filePath: "f.txt",
                    branch: "main",
                    content: "c",
                    message: "m",
                });
                expect(result.isError).toBe(true);
            });
            test("returns error on HTTP 409 conflict", async () => {
                mockReject(h.mockClients.api.put, new Error("Conflict"));
                const result = await callRaw(h.client, "edit_file", {
                    project: "TEST",
                    repository: "my-repo",
                    filePath: "f.txt",
                    branch: "main",
                    content: "c",
                    message: "m",
                    sourceCommitId: "stale-commit",
                });
                expect(result.isError).toBe(true);
            });
        });
    });
    describe("get_file_content", () => {
        test("should read file content", async () => {
            mockJson(h.mockClients.api.get, {
                lines: [{ text: "line 1" }, { text: "line 2" }],
                size: 2,
                isLastPage: true,
            });
            const result = await callRaw(h.client, "get_file_content", {
                project: "TEST",
                repository: "my-repo",
                filePath: "README.md",
            });
            const content = result.content;
            expect(content[0].type).toBe("text");
        });
        test("should pass branch as 'at' search param", async () => {
            mockJson(h.mockClients.api.get, {
                lines: [{ text: "content" }],
                size: 1,
                isLastPage: true,
            });
            await h.client.callTool({
                name: "get_file_content",
                arguments: {
                    project: "TEST",
                    repository: "my-repo",
                    filePath: "src/index.ts",
                    branch: "feature-branch",
                },
            });
            expectCalledWithSearchParams(h.mockClients.api.get, "projects/TEST/repos/my-repo/browse/src/index.ts", { at: "feature-branch" });
        });
        test("should pass limit and start for pagination", async () => {
            mockJson(h.mockClients.api.get, {
                lines: [{ text: "line 50" }],
                size: 1,
                isLastPage: false,
            });
            await h.client.callTool({
                name: "get_file_content",
                arguments: {
                    project: "TEST",
                    repository: "my-repo",
                    filePath: "big-file.ts",
                    limit: 50,
                    start: 100,
                },
            });
            expectCalledWithSearchParams(h.mockClients.api.get, "projects/TEST/repos/my-repo/browse/big-file.ts", { limit: 50, start: 100 });
        });
        test("should use default project when not provided", async () => {
            mockJson(h.mockClients.api.get, { lines: [], size: 0, isLastPage: true });
            await h.client.callTool({
                name: "get_file_content",
                arguments: { repository: "my-repo", filePath: "README.md" },
            });
            expect(h.mockClients.api.get).toHaveBeenCalledWith("projects/DEFAULT/repos/my-repo/browse/README.md", expect.anything());
        });
        test("should handle errors gracefully", async () => {
            mockError(h.mockClients.api.get, new Error("File not found"));
            const result = await callRaw(h.client, "get_file_content", {
                project: "TEST",
                repository: "my-repo",
                filePath: "missing.ts",
            });
            expect(result.isError).toBe(true);
        });
    });
    describe("list_projects", () => {
        test("should pass fields='*all' to bypass curation", async () => {
            const mockResponse = {
                values: [
                    {
                        key: "PROJ",
                        name: "Project",
                        links: { self: [{ href: "https://example.com" }] },
                        extra: "data",
                    },
                ],
                size: 1,
                isLastPage: true,
            };
            mockJson(h.mockClients.api.get, mockResponse);
            const parsed = await callAndParse(h.client, "list_projects", { fields: "*all" });
            expect(parsed.projects[0]).toHaveProperty("links");
            expect(parsed.projects[0]).toHaveProperty("extra");
        });
        test("should curate to only requested fields with custom fields param", async () => {
            mockJson(h.mockClients.api.get, {
                values: [
                    { key: "P", name: "Proj", description: "D", type: "N", extra: "x" },
                ],
                size: 1,
                isLastPage: true,
            });
            const parsed = await callAndParse(h.client, "list_projects", { fields: "key,name" });
            expect(Object.keys(parsed.projects[0]).sort()).toEqual(["key", "name"]);
        });
        test("should handle errors gracefully", async () => {
            mockError(h.mockClients.api.get, new Error("Server error"));
            const result = await callRaw(h.client, "list_projects", {});
            expect(result.isError).toBe(true);
        });
    });
    describe("list_repositories", () => {
        test("should pass fields='*all' to bypass curation", async () => {
            const mockResponse = {
                values: [
                    { slug: "repo", name: "Repo", links: { clone: [] }, extra: "data" },
                ],
                size: 1,
                isLastPage: true,
            };
            mockJson(h.mockClients.api.get, mockResponse);
            const parsed = await callAndParse(h.client, "list_repositories", { project: "TEST", fields: "*all" });
            expect(parsed.repositories[0]).toHaveProperty("links");
            expect(parsed.repositories[0]).toHaveProperty("extra");
        });
        test("should curate to only requested fields with custom fields param", async () => {
            mockJson(h.mockClients.api.get, {
                values: [
                    {
                        slug: "r",
                        name: "Repo",
                        project: { key: "T" },
                        state: "AVAILABLE",
                        extra: "x",
                    },
                ],
                size: 1,
                isLastPage: true,
            });
            const parsed = await callAndParse(h.client, "list_repositories", {
                project: "TEST",
                fields: "slug,name",
            });
            expect(Object.keys(parsed.repositories[0]).sort()).toEqual([
                "name",
                "slug",
            ]);
        });
        test.each([
            { limit: 0, start: 0 },
            { limit: 1, start: 0 },
            { limit: 1000, start: 0 },
            { limit: 25, start: 99999 },
        ])("list_repositories forwards limit=$limit start=$start", async ({ limit, start }) => {
            mockJson(h.mockClients.api.get, {
                values: [],
                size: 0,
                isLastPage: true,
            });
            await h.client.callTool({
                name: "list_repositories",
                arguments: { project: "P", limit, start },
            });
            expectCalledWithSearchParams(h.mockClients.api.get, "projects/P/repos", { limit, start });
        });
        test.each([
            { limit: 0, start: 0 },
            { limit: 1, start: 0 },
            { limit: 1000, start: 0 },
            { limit: 25, start: 99999 },
        ])("list_projects forwards limit=$limit start=$start", async ({ limit, start }) => {
            mockJson(h.mockClients.api.get, {
                values: [],
                size: 0,
                isLastPage: true,
            });
            await h.client.callTool({
                name: "list_projects",
                arguments: { limit, start },
            });
            expectCalledWithSearchParams(h.mockClients.api.get, "projects", {
                limit,
                start,
            });
        });
        test("should handle errors gracefully", async () => {
            mockError(h.mockClients.api.get, new Error("Not Found"));
            const result = await callRaw(h.client, "list_repositories", {
                project: "NONEXISTENT",
            });
            expect(result.isError).toBe(true);
        });
    });
});
//# sourceMappingURL=repositories.test.js.map