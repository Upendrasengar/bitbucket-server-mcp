import { type MockProxy } from "vitest-mock-extended";
import type { KyInstance } from "ky";
import type { ApiClients } from "../http/client.js";
export type MockApiClients = {
  [K in keyof ApiClients]: MockProxy<ApiClients[K]>;
};
export declare function createMockClients(): MockApiClients;
export declare function mockJson<T>(
  fn: MockProxy<KyInstance>["get"],
  response: T,
): void;
export declare function mockText(
  fn: MockProxy<KyInstance>["get"],
  text: string,
): void;
export declare function mockVoid(fn: MockProxy<KyInstance>["delete"]): void;
export declare function mockError(
  fn: MockProxy<KyInstance>["get"],
  error: Error,
): void;
export declare function mockReject(
  fn: MockProxy<KyInstance>[keyof KyInstance],
  error: Error,
): void;
