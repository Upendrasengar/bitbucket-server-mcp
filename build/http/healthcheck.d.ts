import type { ApiClients } from "./client.js";
/**
 * Run a best-effort connectivity check against Bitbucket Server's public
 * `application-properties` endpoint. Opt-in because it adds ~100ms to
 * startup and most clients won't care.
 *
 * Never throws. The server still comes up if the healthcheck fails; the
 * goal is only to surface a clearer diagnostic than the first tool call
 * would otherwise print.
 */
export declare function runStartupHealthcheck(
  clients: ApiClients,
): Promise<void>;
