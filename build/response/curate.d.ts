export declare const DEFAULT_PR_FIELDS: string;
export declare const DEFAULT_PROJECT_FIELDS =
  "key,id,name,description,type,public";
export declare const DEFAULT_REPOSITORY_FIELDS =
  "slug,id,name,description,state,forkable,project.key,project.name";
export declare const DEFAULT_BRANCH_FIELDS =
  "id,displayId,type,latestCommit,isDefault,metadata";
export declare const DEFAULT_SEARCH_FIELDS: string;
export declare const DEFAULT_COMMIT_FIELDS: string;
export declare const DEFAULT_TAG_FIELDS = "id,displayId,type,hash,latestCommit";
export declare const DEFAULT_ACTIVITY_FIELDS: string;
export declare const DEFAULT_USER_FIELDS =
  "name,displayName,emailAddress,slug,active,type";
export declare const DEFAULT_WEBHOOK_FIELDS = "name,url,events,active";
export declare const DEFAULT_REVIEWER_GROUP_FIELDS = "id,name";
export declare const DEFAULT_SECRET_SCANNING_FIELDS = "id,name";
export declare const DEFAULT_DEPLOYMENT_FIELDS: string;
export declare const DEFAULT_COMMENT_FIELDS: string;
export declare const DEFAULT_INSIGHT_FIELDS =
  "key,result,createdDate,details,link,title,reporter";
export declare const DEFAULT_REVIEWER_FIELDS: string;
/**
 * Curate a response object by picking only the specified fields.
 *
 * @param data - The raw API response object
 * @param fields - Either a default field string (comma-separated paths), "*all" for no filtering,
 *                 or a custom comma-separated field list
 * @returns The curated object with only the requested fields
 */
export declare function curateResponse<T extends Record<string, unknown>>(
  data: T,
  fields: string,
): Record<string, unknown>;
/**
 * Curate an array of response objects.
 */
export declare function curateList<T extends Record<string, unknown>>(
  items: T[],
  fields: string,
): Record<string, unknown>[];
