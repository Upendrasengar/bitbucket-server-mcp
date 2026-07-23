interface ContentItem {
  type: "text";
  text: string;
  annotations?: {
    audience?: ("user" | "assistant")[];
  };
}
export interface ToolSuccessResult {
  [key: string]: unknown;
  content: ContentItem[];
}
export interface ToolErrorResult {
  [key: string]: unknown;
  content: ContentItem[];
  isError: true;
}
export declare function formatResponse<T>(data: T): ToolSuccessResult;
export {};
