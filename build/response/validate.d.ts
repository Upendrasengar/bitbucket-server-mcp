import { z } from "zod";
declare const paginatedSchema: z.ZodObject<
  {
    values: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    isLastPage: z.ZodBoolean;
    size: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    start: z.ZodOptional<z.ZodNumber>;
    nextPageStart: z.ZodOptional<z.ZodNumber>;
  },
  z.core.$strip
>;
export type Paginated = z.infer<typeof paginatedSchema>;
export declare function validatePaginated(
  data: unknown,
  context: string,
): Paginated;
export {};
