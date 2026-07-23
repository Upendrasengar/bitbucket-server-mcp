import { mock } from "vitest-mock-extended";
export function createMockClients() {
    return {
        api: mock(),
        buildStatus: mock(),
        commentLikes: mock(),
        emoticons: mock(),
        insights: mock(),
        search: mock(),
        branchUtils: mock(),
        defaultReviewers: mock(),
        git: mock(),
        ui: mock(),
        ssh: mock(),
        gpg: mock(),
    };
}
function fakeResponse(overrides) {
    const noop = () => Promise.resolve();
    return Object.assign(Promise.resolve(new Response()), {
        json: overrides.json ?? noop,
        text: overrides.text ?? (() => Promise.resolve("")),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        bytes: () => Promise.resolve(new Uint8Array()),
    });
}
export function mockJson(fn, response) {
    fn.mockReturnValueOnce(fakeResponse({ json: () => Promise.resolve(response) }));
}
export function mockText(fn, text) {
    fn.mockReturnValueOnce(fakeResponse({ text: () => Promise.resolve(text) }));
}
export function mockVoid(fn) {
    fn.mockReturnValue(fakeResponse({}));
}
export function mockError(fn, error) {
    fn.mockReturnValue(fakeResponse({ json: () => Promise.reject(error) }));
}
export function mockReject(fn, error) {
    fn.mockRejectedValueOnce(error);
}
//# sourceMappingURL=test-utils.js.map