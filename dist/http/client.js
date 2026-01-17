/**
 * HTTP client for making API requests.
 * Provides effectful boundary for HTTP operations.
 * @module http/client
 */
import axios from 'axios';
import { err, tryCatchAsync } from '../core/result.js';
import { httpError } from '../core/errors.js';
import { createAuthHeader } from '../auth/oauth.js';
/**
 * Converts Axios response to HttpResponse.
 * @param response - Axios response
 * @returns HttpResponse object
 */
const toHttpResponse = (response) => ({
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    data: response.data,
});
/**
 * Converts HttpRequestConfig to AxiosRequestConfig.
 * @param config - HTTP request configuration
 * @returns Axios configuration
 */
const toAxiosConfig = (config) => ({
    method: config.method,
    url: config.url,
    headers: config.headers,
    params: config.params,
    data: config.data,
    timeout: config.timeout,
});
/**
 * Extracts error details from Axios error.
 * @param error - Error object
 * @param url - Request URL
 * @param method - HTTP method
 * @returns HttpError object
 */
const extractAxiosError = (error, url, method) => {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 0;
        const message = error.response?.data?.message ?? error.message;
        return httpError(message, status, url, method);
    }
    if (error instanceof Error) {
        return httpError(error.message, 0, url, method);
    }
    return httpError('Unknown HTTP error', 0, url, method);
};
/**
 * Creates an HTTP client instance.
 * @param config - Client configuration
 * @returns HTTP client
 */
export const createHttpClient = (config = {}) => {
    const instance = axios.create({
        baseURL: config.baseUrl,
        timeout: config.timeout ?? 30000,
        headers: {
            'Content-Type': 'application/json',
            ...config.headers,
        },
    });
    let authToken;
    instance.interceptors.request.use((reqConfig) => {
        if (authToken) {
            reqConfig.headers.Authorization = createAuthHeader(authToken);
        }
        return reqConfig;
    });
    const request = async (requestConfig) => tryCatchAsync(async () => {
        const response = await instance.request(toAxiosConfig(requestConfig));
        return toHttpResponse(response);
    }, (e) => extractAxiosError(e, requestConfig.url, requestConfig.method));
    const get = async (url, params) => request({ method: 'get', url, params });
    const post = async (url, data) => request({ method: 'post', url, data });
    const put = async (url, data) => request({ method: 'put', url, data });
    const patch = async (url, data) => request({ method: 'patch', url, data });
    const del = async (url) => request({ method: 'delete', url });
    return {
        request,
        get,
        post,
        put,
        patch,
        delete: del,
        setAuthToken: (token) => { authToken = token; },
        clearAuthToken: () => { authToken = undefined; },
    };
};
/**
 * Builds request headers with optional auth.
 * @param baseHeaders - Base headers
 * @param token - Optional auth token
 * @returns Complete headers object
 */
export const buildRequestHeaders = (baseHeaders, token) => {
    const headers = { ...baseHeaders };
    if (token) {
        headers.Authorization = createAuthHeader(token);
    }
    return headers;
};
/**
 * Merges URL with base URL.
 * @param baseUrl - Base URL
 * @param path - Path to append
 * @returns Complete URL
 */
export const mergeUrls = (baseUrl, path) => {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const pathPart = path.startsWith('/') ? path : `/${path}`;
    return `${base}${pathPart}`;
};
/**
 * Retries a request with exponential backoff.
 * @param fn - Request function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelayMs - Base delay in milliseconds
 * @returns Result from request or final error
 */
export const withRetry = async (fn, maxRetries = 3, baseDelayMs = 1000) => {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const result = await fn();
        if (result._tag === 'Ok') {
            return result;
        }
        lastError = result.error;
        if (attempt < maxRetries) {
            const delay = baseDelayMs * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    return err(lastError);
};
/**
 * Checks if an HTTP status code indicates success.
 * @param status - HTTP status code
 * @returns True if status is 2xx
 */
export const isSuccessStatus = (status) => status >= 200 && status < 300;
/**
 * Checks if an HTTP error is retryable.
 * @param error - HTTP error
 * @returns True if error should be retried
 */
export const isRetryableError = (error) => {
    if (error.statusCode === 0)
        return true;
    if (error.statusCode === 429)
        return true;
    if (error.statusCode >= 500)
        return true;
    return false;
};
/**
 * Creates a configured request for tool execution.
 * @param tool - MCP tool
 * @param params - Extracted parameters
 * @param token - Optional auth token
 * @returns HTTP request configuration
 */
export const buildToolRequest = (method, url, headerParams, body, token) => ({
    method,
    url,
    headers: buildRequestHeaders({
        'Content-Type': 'application/json',
        ...headerParams,
    }, token),
    data: body,
});
//# sourceMappingURL=client.js.map