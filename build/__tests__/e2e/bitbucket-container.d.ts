import { type KyInstance } from "ky";
import type { VersionConfig } from "./versions.js";
export interface StartedBitbucket {
  /** Base URL (http://host:random-port) with path prefix stripped. */
  readonly url: string;
  /** Credentials that the helper provisions via unattended setup. */
  readonly admin: {
    readonly username: string;
    readonly password: string;
  };
  /** Version name as declared in `VERSIONS` (e.g. `"8.9"`). */
  readonly version: string;
  /** ky instance with Basic auth + XSRF bypass pre-configured. */
  readonly api: KyInstance;
  /** Tears down the container. */
  stop(): Promise<void>;
}
/**
 * Boot a Bitbucket Data Center container of the requested version with
 * the unattended setup wired up (DB -> license -> admin user). Returns a
 * ky client that tests share for the duration of the run.
 *
 * Boot time on Apple Silicon (ARM64) for native images is ~30-75s;
 * the amd64-only 7.21 image runs under Rosetta/QEMU and takes ~180-240s.
 */
export declare function startBitbucket(
  version: VersionConfig,
): Promise<StartedBitbucket>;
