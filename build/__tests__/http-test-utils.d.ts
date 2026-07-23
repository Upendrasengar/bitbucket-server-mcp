interface CapturedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}
/**
 * Set up an MSW server that captures all requests for inspection.
 * Returns a `captured` array that tests can read after making calls, plus the
 * underlying `server` so tests can install per-test handlers via `server.use`.
 *
 * Unhandled requests error out (`onUnhandledRequest: "error"`) so that a typo
 * in a URL surfaces as a failed test instead of silently skipping.
 *
 * Must be called at describe scope (it registers vitest lifecycle hooks).
 */
export declare function setupHttpCapture(): {
  captured: CapturedRequest[];
  server: import("msw/node").SetupServer;
};
export {};
