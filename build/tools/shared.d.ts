import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClients } from "../http/client.js";
import type { ApiCache } from "../http/cache.js";
import type { Logger } from "../logging.js";
interface ToolContextParams {
  server: McpServer;
  clients: ApiClients;
  cache: ApiCache;
  logger: Logger;
  defaultProject?: string;
  maxLinesPerFile?: number;
}
export declare class ToolContext {
  readonly server: McpServer;
  readonly clients: ApiClients;
  readonly cache: ApiCache;
  readonly logger: Logger;
  readonly defaultProject?: string;
  readonly maxLinesPerFile: number;
  constructor(params: ToolContextParams);
  resolveProject(provided?: string): string;
}
interface ReviewerEntry {
  user: {
    name: string;
  };
}
interface DefaultReviewerParams {
  clients: ApiClients;
  resolvedProject: string;
  repository: string;
  srcProject: string;
  srcRepo: string;
  sourceBranch: string;
  targetBranch: string;
  existingReviewers: ReviewerEntry[];
}
export declare function mergeDefaultReviewers(
  params: DefaultReviewerParams,
): Promise<ReviewerEntry[]>;
export {};
