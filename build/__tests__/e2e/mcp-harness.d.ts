import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StartedBitbucket } from "./bitbucket-container.js";
export interface McpAgainstBitbucket {
  readonly client: Client;
  close(): Promise<void>;
}
export declare function setupMcpAgainst(
  bb: StartedBitbucket,
): Promise<McpAgainstBitbucket>;
