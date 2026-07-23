import type { KyInstance } from "ky";
import type { RestComment } from "../../generated/types.js";
export interface Scenario {
  readonly projectKey: string;
  readonly repoSlug: string;
  readonly prId: number;
  readonly mainCommitId: string;
}
/**
 * Provisions the minimum state every `comments` test needs: a project,
 * a repo with two branches (main + feature) each with its own commit,
 * and an open PR between them. Uses Bitbucket's `browse` endpoint,
 * which accepts commits via a multipart form (`content`, `message`,
 * `branch`, `sourceBranch`). No git CLI, no shell.
 */
export declare function bootstrap(api: KyInstance): Promise<Scenario>;
type CommentResponse = Pick<
  RestComment,
  "id" | "version" | "text" | "state" | "severity"
> & {
  threadResolved?: boolean;
};
export declare function createComment(
  api: KyInstance,
  s: Scenario,
  text: string,
): Promise<CommentResponse>;
export {};
