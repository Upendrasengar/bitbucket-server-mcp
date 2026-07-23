import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export interface Logger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
}
export declare const logger: Logger;
export declare function attachLogger(server: McpServer): Logger;
