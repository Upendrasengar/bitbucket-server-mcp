import type { ToolErrorResult } from "../response/format.js";
export declare function formatApiError(
  status: number,
  serverResponse: string,
): ToolErrorResult;
export declare function extractBitbucketMessage(data: unknown): string;
/**
 * Map any thrown value from a tool handler to an MCP-shaped error result.
 *
 * For ky's `HTTPError`, the parsed response body lives on `error.data`
 * (ky v2 pre-parses JSON before throwing). Read it directly and extract a
 * Bitbucket message so callers get the actual server reason
 * (`exceptionName: message`) instead of ky's generic "Request failed".
 *
 * Do NOT duck-type on `error.response.data?.message`: ky does not populate
 * `response.data`. The previous implementation did and the body was being
 * silently dropped in production.
 */
export declare function handleToolError(error: unknown): ToolErrorResult;
