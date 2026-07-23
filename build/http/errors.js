import { HTTPError } from "ky";
import { logger } from "../logging.js";
const ERROR_GUIDANCE = {
    401: "Authentication failed. Verify BITBUCKET_TOKEN or BITBUCKET_USERNAME/BITBUCKET_PASSWORD environment variables.",
    403: "Permission denied. Your credentials may not have access to this resource.",
    404: "Not found. Verify the project key, repository slug, and PR/comment ID are correct.",
    409: "Version conflict. The resource was modified since you last fetched it. Re-fetch and retry with the updated version.",
    429: "Rate limited. Wait a moment before retrying; the server will retry automatically for GET requests.",
};
// Cap on how much of a raw body ends up in the returned MCP error. Bitbucket
// normally stays well under this; the cap guards against accidentally
// surfacing a 10 MiB HTML error page from a misconfigured proxy.
const MAX_BODY_CHARS = 500;
export function formatApiError(status, serverResponse) {
    const guidance = ERROR_GUIDANCE[status] ??
        (status >= 500
            ? "Bitbucket server error. The server may be temporarily unavailable; try again."
            : `Unexpected HTTP ${status} error.`);
    return {
        content: [
            {
                type: "text",
                text: `${guidance}\n\nServer response: ${serverResponse}`,
            },
        ],
        isError: true,
    };
}
/**
 * Pull the most actionable text out of a failed Bitbucket Server response
 * body. Bitbucket Server responds with
 *   { "errors": [{ "message": "...", "exceptionName": "..." }] }
 * on most failures, so prefer that shape. Fall back to a generic `.message`
 * field, then to the raw body (truncated).
 */
function hasExceptionName(data) {
    if (data == null || typeof data !== "object")
        return false;
    const body = data;
    if (!Array.isArray(body.errors) || body.errors.length === 0)
        return false;
    return body.errors.some((e) => e != null &&
        typeof e === "object" &&
        typeof e.exceptionName === "string" &&
        e.exceptionName !== "");
}
function formatReviewerErrors(reviewerErrors) {
    if (!Array.isArray(reviewerErrors))
        return undefined;
    const parts = [];
    for (const re of reviewerErrors) {
        if (!(re && typeof re === "object"))
            continue;
        const r = re;
        const ctx = typeof r.context === "string" ? r.context : null;
        const rMsg = typeof r.message === "string" ? r.message : null;
        if (rMsg) {
            parts.push(ctx ? `reviewer "${ctx}": ${rMsg}` : `reviewer: ${rMsg}`);
        }
    }
    return parts.length > 0 ? parts.join("; ") : undefined;
}
function formatValidReviewers(validReviewers) {
    if (!Array.isArray(validReviewers) || validReviewers.length === 0)
        return undefined;
    const names = validReviewers
        .map((vr) => {
        if (vr == null)
            return undefined;
        if (typeof vr === "object") {
            const v = vr;
            return v.user && typeof v.user === "object"
                ? v.user.name
                : String(vr);
        }
        return String(vr);
    })
        .filter((n) => typeof n === "string" && n.length > 0);
    return names.length > 0 ? `validReviewers: [${names.join(", ")}]` : undefined;
}
function formatErrorParts(e) {
    const pieces = [];
    const core = [e.exceptionName, e.message].filter((s) => typeof s === "string" && s.length > 0);
    pieces.push(...core);
    const reviewerText = formatReviewerErrors(e.reviewerErrors);
    if (reviewerText)
        pieces.push(reviewerText);
    const validReviewersText = formatValidReviewers(e.validReviewers);
    if (validReviewersText)
        pieces.push(validReviewersText);
    return pieces.join(": ");
}
export function extractBitbucketMessage(data) {
    if (data == null)
        return "";
    if (typeof data === "string") {
        return data.slice(0, MAX_BODY_CHARS);
    }
    if (typeof data !== "object")
        return "";
    const body = data;
    if (Array.isArray(body.errors) && body.errors.length > 0) {
        const parts = body.errors
            .map(formatErrorParts)
            .filter((s) => s.length > 0);
        if (parts.length > 0)
            return parts.join("; ");
    }
    if (typeof body.message === "string")
        return body.message;
    return "";
}
/**
 * Map any thrown value from a tool handler to an MCP-shaped error result.
 *
 * For ky's `HTTPError`, the parsed response body lives on `error.data`
 * (ky v2 pre-parses JSON before throwing). Read it directly and extract a
 * Bitbucket message so callers get the actual server reason
 * (`exceptionName: message`) instead of ky's generic "Request failed".
 *
 * Do NOT duck-type on `error.response.data?.message`: ky does not populate
 * `response.data`. The previous implementation did and the body was being
 * silently dropped in production.
 */
export function handleToolError(error) {
    if (error instanceof HTTPError) {
        const { status } = error.response;
        const body = extractBitbucketMessage(error.data);
        const msg = body || error.message;
        logger.error(`API error ${status}`, msg);
        // Surface structured Bitbucket errors directly — the server's
        // exceptionName + message (+ reviewerErrors, etc.) is more actionable
        // than any generic status-based guidance we could add.
        if (hasExceptionName(error.data)) {
            return {
                content: [{ type: "text", text: msg }],
                isError: true,
            };
        }
        return formatApiError(status, msg);
    }
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Tool error", message);
    return {
        content: [{ type: "text", text: `Unexpected error: ${message}` }],
        isError: true,
    };
}
//# sourceMappingURL=errors.js.map