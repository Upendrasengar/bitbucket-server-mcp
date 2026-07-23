import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BitbucketServerOptions } from "./types.js";
export declare function createServer(options?: BitbucketServerOptions): {
  server: McpServer;
  config: import("./types.js").BitbucketConfig;
  runStartupHealthcheck: () => Promise<void>;
};
