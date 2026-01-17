/**
 * Token management for OAuth tokens.
 * Provides pure functions for token storage and refresh operations.
 * @module auth/tokenManager
 */
import { Result } from '../core/result.js';
import { type TokenError } from '../core/errors.js';
import type { TokenSet, OAuthConfig } from '../core/types.js';
/**
 * Token storage interface for pluggable backends.
 */
export interface TokenStorage {
    readonly get: (key: string) => Promise<TokenSet | undefined>;
    readonly set: (key: string, token: TokenSet) => Promise<void>;
    readonly delete: (key: string) => Promise<void>;
}
/**
 * Creates an in-memory token storage.
 * Suitable for development and testing.
 * @returns Token storage instance
 */
export declare const createMemoryStorage: () => TokenStorage;
/**
 * Token manager state.
 */
export interface TokenManagerState {
    readonly storage: TokenStorage;
    readonly config: OAuthConfig;
    readonly httpFetch: typeof fetch;
}
/**
 * Creates a default token manager state.
 * @param config - OAuth configuration
 * @param storage - Optional token storage (defaults to memory)
 * @param httpFetch - Optional fetch function (defaults to global fetch)
 * @returns Token manager state
 */
export declare const createTokenManagerState: (config: OAuthConfig, storage?: TokenStorage, httpFetch?: typeof fetch) => TokenManagerState;
/**
 * Retrieves a token from storage.
 * @param state - Token manager state
 * @param key - Storage key
 * @returns Result containing token or error
 */
export declare const getToken: (state: TokenManagerState, key: string) => Promise<Result<TokenSet, TokenError>>;
/**
 * Stores a token in storage.
 * @param state - Token manager state
 * @param key - Storage key
 * @param token - Token to store
 * @returns Result indicating success or error
 */
export declare const setToken: (state: TokenManagerState, key: string, token: TokenSet) => Promise<Result<void, TokenError>>;
/**
 * Removes a token from storage.
 * @param state - Token manager state
 * @param key - Storage key
 * @returns Result indicating success or error
 */
export declare const deleteToken: (state: TokenManagerState, key: string) => Promise<Result<void, TokenError>>;
/**
 * Performs a token refresh request.
 * @param state - Token manager state
 * @param refreshToken - Refresh token to use
 * @returns Result containing new token set or error
 */
export declare const refreshTokenRequest: (state: TokenManagerState, refreshToken: string) => Promise<Result<TokenSet, TokenError>>;
/**
 * Gets a valid token, refreshing if necessary.
 * @param state - Token manager state
 * @param key - Storage key
 * @returns Result containing valid token or error
 */
export declare const getValidToken: (state: TokenManagerState, key: string) => Promise<Result<TokenSet, TokenError>>;
/**
 * Gets the Authorization header for a stored token.
 * @param state - Token manager state
 * @param key - Storage key
 * @returns Result containing auth header or error
 */
export declare const getAuthHeader: (state: TokenManagerState, key: string) => Promise<Result<string, TokenError>>;
/**
 * Calculates time until token expiration.
 * @param token - Token set
 * @returns Milliseconds until expiration, or undefined if no expiry
 */
export declare const getTimeUntilExpiry: (token: TokenSet) => number | undefined;
/**
 * Creates a token with updated expiration.
 * @param token - Original token
 * @param expiresInSeconds - New expiration time in seconds
 * @returns Updated token set
 */
export declare const withNewExpiry: (token: TokenSet, expiresInSeconds: number) => TokenSet;
/**
 * Merges a new token with an existing token's refresh token.
 * Preserves refresh token if new token doesn't include one.
 * @param existingToken - Existing token (may have refresh token)
 * @param newToken - New token from refresh
 * @returns Merged token set
 */
export declare const mergeTokens: (existingToken: TokenSet, newToken: TokenSet) => TokenSet;
/**
 * Validates a token structure.
 * @param token - Token to validate
 * @returns Result containing token or validation error
 */
export declare const validateToken: (token: unknown) => Result<TokenSet, TokenError>;
//# sourceMappingURL=tokenManager.d.ts.map