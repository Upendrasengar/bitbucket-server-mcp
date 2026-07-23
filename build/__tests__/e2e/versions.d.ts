/**
 * Declarative matrix of Bitbucket Data Center versions the e2e suite
 * exercises. Feature partitions are derived at the call site by
 * comparing `name` to a minimum version (see `gte` / `lt`), so a new
 * feature that lands in, say, 9.0 does not require another boolean
 * flag on every row here.
 */
export interface VersionConfig {
  readonly name: string;
  readonly image: string;
  /**
   * Extra lines appended to the generated `bitbucket.properties` when the
   * container boots. Used when a version needs settings beyond the
   * defaults (license, admin user) to finish the unattended setup.
   */
  readonly extraProperties?: Readonly<Record<string, string>>;
  /**
   * Extra environment variables passed to the container. Used for JVM
   * system properties (via `JVM_SUPPORT_RECOMMENDED_ARGS`) that
   * `bitbucket.properties` does not reach, e.g. the basic-auth
   * force-allow flag on 10.x fresh installs.
   */
  readonly extraEnv?: Readonly<Record<string, string>>;
}
/**
 * 10.x fresh installs disable basic auth for REST by default. The
 * `DisableBasicAuthFilter` class inside `atlassian-authentication-plugin`
 * reads the JVM system property `com.atlassian.plugins.authentication
 * .basic.auth.filter.force.allow`; setting it to `true` before the JVM
 * starts re-enables basic auth for the whole instance. The setting is
 * not reachable through `bitbucket.properties`, so 10.2 ships with an
 * `extraEnv` entry that passes the flag via `JVM_SUPPORT_RECOMMENDED_ARGS`
 * on the container image.
 */
export declare const VERSIONS: readonly [
  {
    readonly name: "7.21";
    readonly image: "atlassian/bitbucket:7.21";
  },
  {
    readonly name: "8.5";
    readonly image: "atlassian/bitbucket:8.5";
  },
  {
    readonly name: "8.9";
    readonly image: "atlassian/bitbucket:8.9";
  },
  {
    readonly name: "8.19";
    readonly image: "atlassian/bitbucket:8.19";
  },
  {
    readonly name: "9.4";
    readonly image: "atlassian/bitbucket:9.4";
  },
  {
    readonly name: "10.2";
    readonly image: "atlassian/bitbucket:10.2";
    readonly extraEnv: {
      readonly JVM_SUPPORT_RECOMMENDED_ARGS: "-Dcom.atlassian.plugins.authentication.basic.auth.filter.force.allow=true";
    };
  },
];
export declare function compareVersions(a: string, b: string): number;
export declare function gte(v: VersionConfig, min: string): boolean;
export declare function lt(v: VersionConfig, min: string): boolean;
export declare const SELECTED_VERSIONS: readonly VersionConfig[];
/** `threadResolved` on comments landed in 8.9 LTS. */
export declare const THREAD_RESOLVED_SINCE = "8.9";
export declare const VERSIONS_WITH_THREAD_RESOLVED: VersionConfig[];
export declare const VERSIONS_WITHOUT_THREAD_RESOLVED: VersionConfig[];
/** Labels were introduced in Bitbucket Server 5.13, below our minimum of 7.21. */
export declare const LABELS_SINCE = "7.21";
export declare const VERSIONS_WITH_LABELS: VersionConfig[];
export declare const VERSIONS_WITHOUT_LABELS: VersionConfig[];
