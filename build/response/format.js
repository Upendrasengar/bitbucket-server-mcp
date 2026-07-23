export function formatResponse(data) {
    return {
        content: [{ type: "text", text: JSON.stringify(data) }],
    };
}
//# sourceMappingURL=format.js.map