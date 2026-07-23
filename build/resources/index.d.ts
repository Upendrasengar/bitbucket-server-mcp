import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClients } from "../http/client.js";
import type { ApiCache } from "../http/cache.js";
export declare function registerResources(
  server: McpServer,
  clients: ApiClients,
  cache: ApiCache,
): void;
