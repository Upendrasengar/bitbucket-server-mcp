import { type KyInstance, type Options } from "ky";
import type { BitbucketConfig } from "../types.js";
import { type Paginated } from "../response/validate.js";
export interface ApiClients {
  api: KyInstance;
  buildStatus: KyInstance;
  commentLikes: KyInstance;
  emoticons: KyInstance;
  insights: KyInstance;
  search: KyInstance;
  branchUtils: KyInstance;
  defaultReviewers: KyInstance;
  git: KyInstance;
  ui: KyInstance;
  ssh: KyInstance;
  gpg: KyInstance;
}
export declare function createApiClients(config: BitbucketConfig): ApiClients;
export declare function getPaginated(
  client: KyInstance,
  url: string,
  options?: Options,
): Promise<Paginated>;
