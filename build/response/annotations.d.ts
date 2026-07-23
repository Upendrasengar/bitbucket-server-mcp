interface ToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}
export declare function toolAnnotations(
  overrides?: ToolAnnotations,
): ToolAnnotations;
export {};
