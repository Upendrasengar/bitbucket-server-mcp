import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { expect } from "vitest";
import type { MockProxy } from "vitest-mock-extended";
import type { KyInstance } from "ky";
import { ToolContext } from "../tools/shared.js";
import type { ToolSuccessResult } from "../response/format.js";
import { type MockApiClients } from "./test-utils.js";
interface ToolTestContext {
  readonly client: Client;
  readonly mockClients: MockApiClients;
  readonly ctx: ToolContext;
}
interface McpConnection extends AsyncDisposable {
  readonly client: Client;
}
export declare function connectMcp(server: McpServer): Promise<McpConnection>;
/**
 * Build a standalone ToolContext for unit tests that do not need an MCP
 * client/server pair. Mirrors the construction inside `setupToolHarness` so
 * both entry points stay in sync.
 */
export declare function createTestToolContext(
  overrides?: Partial<ConstructorParameters<typeof ToolContext>[0]>,
): ToolContext;
/**
 * Spin up a fresh McpServer + Client pair with mocked API clients for each test.
 * The caller registers its tools against `harness.ctx` inside the register callback.
 *
 * IMPORTANT: must be called at describe() scope. It registers `beforeEach` and
 * `afterEach` hooks as a side effect; calling it from a helper or outside a
 * describe block would bind those hooks to the wrong scope (or to root scope).
 *
 * Usage:
 *   describe("Branch tools", () => {
 *     const h = setupToolHarness({
 *       register: registerBranchTools, // from ../../tools/refs.js
 *       defaultProject: "DEFAULT",
 *     });
 *     // inside tests:
 *     h.client.callTool(...)
 *     h.mockClients.api.get.mockReturnValueOnce(...)
 *   });
 */
export declare function setupToolHarness(options: {
  register: (ctx: ToolContext) => void;
  defaultProject?: string;
  maxLinesPerFile?: number;
  cacheTtlMs?: number;
}): ToolTestContext;
/**
 * Narrow view of the MCP SDK's CallToolResult.
 *
 * The SDK types `content` as a union of text/image/audio/resource variants.
 * Our server always returns text-only content, so tests can safely use this
 * narrower type and access `.content[0].text` without an inline cast.
 */
interface TextToolResult {
  content: ToolSuccessResult["content"];
  isError?: boolean;
}
/**
 * Call a tool and parse its first text-content block as JSON.
 */
export declare function callAndParse<T = unknown>(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<T>;
/**
 * Call a tool and return both the raw result and the parsed first text-content
 * block as JSON. Use this when the test needs to assert on `result.isError` or
 * inspect the raw text alongside the parsed payload.
 */
export declare function callAndParseFull<T = unknown>(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<{
  result: TextToolResult;
  text: string;
  parsed: T;
}>;
/**
 * Call a tool and return the raw result without parsing. Use this when the
 * test only cares about `result.isError` or the raw text (e.g. error paths).
 */
export declare function callRaw(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<TextToolResult>;
/**
 * Helpers below are sugar over `expect(fn).toHaveBeenCalledWith(url, expect.objectContaining({...}))`.
 * They cover the three common request shapes (plain options, searchParams, json body).
 *
 * When to fall back to a raw `toHaveBeenCalledWith`:
 *   - combined search params AND headers (build the matcher inline)
 *   - non-JSON bodies like FormData (use `expectCalledWith(fn, url, { body: expect.any(FormData) })`)
 *   - `.not.toHaveBeenCalled()` and similar negative assertions
 *
 * For strict equality on the json body (catches unexpected extra keys) use
 * `expectCalledWithStrictJson`; the default `expectCalledWithJson` only asserts
 * a subset so tool tests can lock the fields they care about.
 */
/**
 * Assert that a ky mock was called with the given URL and (optionally) options
 * matching `expect.objectContaining(opts)`. Values inside `opts` are matched
 * verbatim (use `expect.objectContaining`, `expect.any`, etc. explicitly when
 * needed for nested partial matches).
 */
export declare function expectCalledWith<
  F extends MockProxy<KyInstance>[keyof KyInstance],
>(
  fn: F,
  url: string | ReturnType<typeof expect.stringContaining>,
  opts?: Record<string, unknown>,
): void;
/**
 * Assert that a ky mock was called with a URL and `searchParams` containing
 * all of `params`. Shortens the very common pattern:
 *   toHaveBeenCalledWith(url, expect.objectContaining({
 *     searchParams: expect.objectContaining({...})
 *   }))
 */
export declare function expectCalledWithSearchParams<
  F extends MockProxy<KyInstance>[keyof KyInstance],
>(
  fn: F,
  url: string | ReturnType<typeof expect.stringContaining>,
  params: Record<string, unknown>,
): void;
/**
 * Assert that a ky mock was called with a URL and `json` body partially
 * matching `body`. Uses `expect.objectContaining` on the body so extra keys
 * sent by the code under test are ignored. Prefer `expectCalledWithStrictJson`
 * when the test should fail if the production code starts sending additional
 * fields (leak-sensitive endpoints, contract-shaped payloads).
 */
export declare function expectCalledWithJson<
  F extends MockProxy<KyInstance>[keyof KyInstance],
>(
  fn: F,
  url: string | ReturnType<typeof expect.stringContaining>,
  body: Record<string, unknown>,
): void;
/**
 * Stricter variant of `expectCalledWithJson`: asserts that `json` equals
 * `body` exactly. Use for endpoints where an extra unexpected field would be
 * a regression (e.g. credentials/config keys leaking into a request body).
 */
export declare function expectCalledWithStrictJson<
  F extends MockProxy<KyInstance>[keyof KyInstance],
>(
  fn: F,
  url: string | ReturnType<typeof expect.stringContaining>,
  body: Record<string, unknown>,
): void;
export {};
