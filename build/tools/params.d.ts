import { z } from "zod";
export declare function projectParam(): z.ZodOptional<z.ZodString>;
export declare function repositoryParam(): z.ZodString;
export declare function limitParam(): z.ZodOptional<z.ZodNumber>;
export declare function startParam(): z.ZodOptional<z.ZodNumber>;
/**
 * Optional `fields` selector for read tools that curate their response.
 *
 * The description is deliberately short and generic: the schema ships on
 * every tool every session, and the curated default applies automatically
 * when the caller omits `fields`, so there is no value in repeating the
 * per-entity default inline. Omit for the curated default; pass `*all` for
 * the raw API response; otherwise pass comma-separated dot paths
 * (e.g. "author.user.name,state").
 */
export declare function fieldsParam(): z.ZodOptional<z.ZodString>;
