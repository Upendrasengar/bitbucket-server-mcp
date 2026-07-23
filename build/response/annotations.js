const DEFAULT_ANNOTATIONS = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
};
export function toolAnnotations(overrides) {
    return { ...DEFAULT_ANNOTATIONS, ...overrides };
}
//# sourceMappingURL=annotations.js.map