/**
 * OAuth 2.1 implementation for MCP servers.
 * Provides pure functions for OAuth flow management.
 * @module auth/oauth
 */
import { Result } from '../core/result.js';
import { type OAuthError } from '../core/errors.js';
import type { OAuthConfig, TokenSet, PkceParams } from '../core/types.js';
/**
 * Authorization flow state stored between requests.
 */
export interface AuthorizationState {
    readonly state: string;
    readonly pkce: PkceParams;
    readonly redirectUri: string;
    readonly createdAt: number;
}
/**
 * Builds the authorization URL for OAuth 2.1 flow.
 * @param config - OAuth configuration
 * @param state - Authorization state
 * @returns Complete authorization URL
 */
export declare const buildAuthorizationUrl: (config: OAuthConfig, state: AuthorizationState) => string;
/**
 * Creates a new authorization state for starting OAuth flow.
 * @param redirectUri - Redirect URI for callback
 * @returns Authorization state object
 */
export declare const createAuthorizationState: (redirectUri: string) => AuthorizationState;
/**
 * Validates the state parameter from callback.
 * @param expected - Expected state value
 * @param received - Received state value
 * @returns True if states match
 */
export declare const validateState: (expected: string, received: string) => boolean;
/**
 * Checks if authorization state has expired.
 * @param state - Authorization state
 * @param maxAgeMs - Maximum age in milliseconds (default: 10 minutes)
 * @returns True if state has expired
 */
export declare const isStateExpired: (state: AuthorizationState, maxAgeMs?: number) => boolean;
/**
 * Builds the token request body for authorization code exchange.
 * @param config - OAuth configuration
 * @param code - Authorization code
 * @param state - Authorization state
 * @returns Token request body
 */
export declare const buildTokenRequestBody: (config: OAuthConfig, code: string, state: AuthorizationState) => Record<string, string>;
/**
 * Builds the token request body for client credentials flow.
 * @param config - OAuth configuration
 * @returns Token request body
 */
export declare const buildClientCredentialsBody: (config: OAuthConfig) => Record<string, string>;
/**
 * Builds the token request body for refresh token flow.
 * @param config - OAuth configuration
 * @param refreshToken - Refresh token
 * @returns Token request body
 */
export declare const buildRefreshTokenBody: (config: OAuthConfig, refreshToken: string) => Record<string, string>;
/**
 * Parses and validates a token response.
 * @param response - Raw response data
 * @returns Result containing TokenSet or error
 */
export declare const parseTokenResponse: (response: unknown) => Result<TokenSet, OAuthError>;
/**
 * Checks if a token is expired or about to expire.
 * @param token - Token set to check
 * @param bufferMs - Buffer time before actual expiry (default: 30 seconds)
 * @returns True if token is expired or about to expire
 */
export declare const isTokenExpired: (token: TokenSet, bufferMs?: number) => boolean;
/**
 * Checks if a token can be refreshed.
 * @param token - Token set to check
 * @returns True if refresh token is available
 */
export declare const canRefreshToken: (token: TokenSet) => boolean;
/**
 * Creates the Authorization header value from a token.
 * @param token - Token set
 * @returns Authorization header value
 */
export declare const createAuthHeader: (token: TokenSet) => string;
/**
 * Extracts scopes from a token as an array.
 * @param token - Token set
 * @returns Array of scope strings
 */
export declare const getTokenScopes: (token: TokenSet) => string[];
/**
 * Checks if a token has a specific scope.
 * @param token - Token set
 * @param scope - Scope to check for
 * @returns True if token has the scope
 */
export declare const hasScope: (token: TokenSet, scope: string) => boolean;
/**
 * Validates OAuth configuration.
 * @param config - OAuth configuration to validate
 * @returns Result containing config or error
 */
export declare const validateOAuthConfig: (config: OAuthConfig) => Result<OAuthConfig, OAuthError>;
/**
 * Pipeline for validating and building authorization URL.
 * @param config - OAuth configuration
 * @param redirectUri - Redirect URI
 * @returns Result containing auth URL and state
 */
export declare const initializeAuthFlow: (config: OAuthConfig, redirectUri: string) => Result<{
    url: string;
    state: AuthorizationState;
}, OAuthError>;
//# sourceMappingURL=oauth.d.ts.map