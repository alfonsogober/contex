/**
 * Token management for OAuth tokens.
 * Provides pure functions for token storage and refresh operations.
 * @module auth/tokenManager
 */
import { ok, err, tryCatchAsync } from '../core/result.js';
import { tokenError } from '../core/errors.js';
import { isTokenExpired, canRefreshToken, buildRefreshTokenBody, parseTokenResponse, createAuthHeader, } from './oauth.js';
/**
 * Creates an in-memory token storage.
 * Suitable for development and testing.
 * @returns Token storage instance
 */
export const createMemoryStorage = () => {
    const store = new Map();
    return {
        get: async (key) => store.get(key),
        set: async (key, token) => { store.set(key, token); },
        delete: async (key) => { store.delete(key); },
    };
};
/**
 * Creates a default token manager state.
 * @param config - OAuth configuration
 * @param storage - Optional token storage (defaults to memory)
 * @param httpFetch - Optional fetch function (defaults to global fetch)
 * @returns Token manager state
 */
export const createTokenManagerState = (config, storage, httpFetch) => ({
    storage: storage ?? createMemoryStorage(),
    config,
    httpFetch: httpFetch ?? fetch,
});
/**
 * Retrieves a token from storage.
 * @param state - Token manager state
 * @param key - Storage key
 * @returns Result containing token or error
 */
export const getToken = async (state, key) => {
    const token = await state.storage.get(key);
    if (!token) {
        return err(tokenError('Token not found', key));
    }
    return ok(token);
};
/**
 * Stores a token in storage.
 * @param state - Token manager state
 * @param key - Storage key
 * @param token - Token to store
 * @returns Result indicating success or error
 */
export const setToken = async (state, key, token) => tryCatchAsync(async () => state.storage.set(key, token), (e) => tokenError(e instanceof Error ? e.message : 'Failed to store token'));
/**
 * Removes a token from storage.
 * @param state - Token manager state
 * @param key - Storage key
 * @returns Result indicating success or error
 */
export const deleteToken = async (state, key) => tryCatchAsync(async () => state.storage.delete(key), (e) => tokenError(e instanceof Error ? e.message : 'Failed to delete token'));
/**
 * Performs a token refresh request.
 * @param state - Token manager state
 * @param refreshToken - Refresh token to use
 * @returns Result containing new token set or error
 */
export const refreshTokenRequest = async (state, refreshToken) => {
    const body = buildRefreshTokenBody(state.config, refreshToken);
    const result = await tryCatchAsync(async () => {
        const response = await state.httpFetch(state.config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(body).toString(),
        });
        return response.json();
    }, (e) => tokenError(e instanceof Error ? e.message : 'Token refresh request failed'));
    if (result._tag === 'Err') {
        return result;
    }
    const parseResult = parseTokenResponse(result.value);
    if (parseResult._tag === 'Err') {
        return err(tokenError(parseResult.error.message));
    }
    return parseResult;
};
/**
 * Gets a valid token, refreshing if necessary.
 * @param state - Token manager state
 * @param key - Storage key
 * @returns Result containing valid token or error
 */
export const getValidToken = async (state, key) => {
    const tokenResult = await getToken(state, key);
    if (tokenResult._tag === 'Err') {
        return tokenResult;
    }
    const token = tokenResult.value;
    if (!isTokenExpired(token)) {
        return ok(token);
    }
    if (!canRefreshToken(token)) {
        return err(tokenError('Token expired and no refresh token available'));
    }
    const refreshResult = await refreshTokenRequest(state, token.refreshToken);
    if (refreshResult._tag === 'Err') {
        return refreshResult;
    }
    const newToken = refreshResult.value;
    await setToken(state, key, newToken);
    return ok(newToken);
};
/**
 * Gets the Authorization header for a stored token.
 * @param state - Token manager state
 * @param key - Storage key
 * @returns Result containing auth header or error
 */
export const getAuthHeader = async (state, key) => {
    const tokenResult = await getValidToken(state, key);
    if (tokenResult._tag === 'Err') {
        return tokenResult;
    }
    return ok(createAuthHeader(tokenResult.value));
};
/**
 * Calculates time until token expiration.
 * @param token - Token set
 * @returns Milliseconds until expiration, or undefined if no expiry
 */
export const getTimeUntilExpiry = (token) => {
    if (!token.expiresAt)
        return undefined;
    return Math.max(0, token.expiresAt - Date.now());
};
/**
 * Creates a token with updated expiration.
 * @param token - Original token
 * @param expiresInSeconds - New expiration time in seconds
 * @returns Updated token set
 */
export const withNewExpiry = (token, expiresInSeconds) => ({
    ...token,
    expiresAt: Date.now() + expiresInSeconds * 1000,
});
/**
 * Merges a new token with an existing token's refresh token.
 * Preserves refresh token if new token doesn't include one.
 * @param existingToken - Existing token (may have refresh token)
 * @param newToken - New token from refresh
 * @returns Merged token set
 */
export const mergeTokens = (existingToken, newToken) => ({
    ...newToken,
    refreshToken: newToken.refreshToken ?? existingToken.refreshToken,
});
/**
 * Validates a token structure.
 * @param token - Token to validate
 * @returns Result containing token or validation error
 */
export const validateToken = (token) => {
    if (!token || typeof token !== 'object') {
        return err(tokenError('Invalid token format'));
    }
    const t = token;
    if (typeof t.accessToken !== 'string' || !t.accessToken) {
        return err(tokenError('Missing or invalid accessToken'));
    }
    if (typeof t.tokenType !== 'string' || !t.tokenType) {
        return err(tokenError('Missing or invalid tokenType'));
    }
    return ok(token);
};
//# sourceMappingURL=tokenManager.js.map