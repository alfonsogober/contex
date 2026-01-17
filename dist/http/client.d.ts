/**
 * HTTP client for making API requests.
 * Provides effectful boundary for HTTP operations.
 * @module http/client
 */
import { Result } from '../core/result.js';
import { type HttpError } from '../core/errors.js';
import type { HttpRequestConfig, HttpResponse, TokenSet, HttpMethod } from '../core/types.js';
/**
 * HTTP client configuration.
 */
export interface HttpClientConfig {
    readonly baseUrl?: string;
    readonly timeout?: number;
    readonly headers?: Record<string, string>;
}
/**
 * HTTP client instance.
 */
export interface HttpClient {
    readonly request: <T = unknown>(config: HttpRequestConfig) => Promise<Result<HttpResponse<T>, HttpError>>;
    readonly get: <T = unknown>(url: string, params?: Record<string, unknown>) => Promise<Result<HttpResponse<T>, HttpError>>;
    readonly post: <T = unknown>(url: string, data?: unknown) => Promise<Result<HttpResponse<T>, HttpError>>;
    readonly put: <T = unknown>(url: string, data?: unknown) => Promise<Result<HttpResponse<T>, HttpError>>;
    readonly patch: <T = unknown>(url: string, data?: unknown) => Promise<Result<HttpResponse<T>, HttpError>>;
    readonly delete: <T = unknown>(url: string) => Promise<Result<HttpResponse<T>, HttpError>>;
    readonly setAuthToken: (token: TokenSet) => void;
    readonly clearAuthToken: () => void;
}
/**
 * Creates an HTTP client instance.
 * @param config - Client configuration
 * @returns HTTP client
 */
export declare const createHttpClient: (config?: HttpClientConfig) => HttpClient;
/**
 * Builds request headers with optional auth.
 * @param baseHeaders - Base headers
 * @param token - Optional auth token
 * @returns Complete headers object
 */
export declare const buildRequestHeaders: (baseHeaders: Record<string, string>, token?: TokenSet) => Record<string, string>;
/**
 * Merges URL with base URL.
 * @param baseUrl - Base URL
 * @param path - Path to append
 * @returns Complete URL
 */
export declare const mergeUrls: (baseUrl: string, path: string) => string;
/**
 * Retries a request with exponential backoff.
 * @param fn - Request function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelayMs - Base delay in milliseconds
 * @returns Result from request or final error
 */
export declare const withRetry: <T, E>(fn: () => Promise<Result<T, E>>, maxRetries?: number, baseDelayMs?: number) => Promise<Result<T, E>>;
/**
 * Checks if an HTTP status code indicates success.
 * @param status - HTTP status code
 * @returns True if status is 2xx
 */
export declare const isSuccessStatus: (status: number) => boolean;
/**
 * Checks if an HTTP error is retryable.
 * @param error - HTTP error
 * @returns True if error should be retried
 */
export declare const isRetryableError: (error: HttpError) => boolean;
/**
 * Creates a configured request for tool execution.
 * @param tool - MCP tool
 * @param params - Extracted parameters
 * @param token - Optional auth token
 * @returns HTTP request configuration
 */
export declare const buildToolRequest: (method: HttpMethod, url: string, headerParams: Record<string, string>, body: unknown, token?: TokenSet) => HttpRequestConfig;
//# sourceMappingURL=client.d.ts.map