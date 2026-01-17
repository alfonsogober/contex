/**
 * OAuth 2.1 implementation for MCP servers.
 * Provides pure functions for OAuth flow management.
 * @module auth/oauth
 */

import { Result, ok, err } from '../core/result.js';
import { oauthError, type OAuthError } from '../core/errors.js';
import type { OAuthConfig, TokenSet, PkceParams } from '../core/types.js';
import {
  generatePkceParams,
  pkceToQueryParams,
  pkceToTokenParams,
  generateState,
} from './pkce.js';

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
export const buildAuthorizationUrl = (
  config: OAuthConfig,
  state: AuthorizationState
): string => {
  const url = new URL(config.authorizationUrl);
  
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', state.redirectUri);
  url.searchParams.set('state', state.state);
  
  if (config.scopes.length > 0) {
    url.searchParams.set('scope', config.scopes.join(' '));
  }
  
  if (config.pkce !== false) {
    const pkceParams = pkceToQueryParams(state.pkce);
    Object.entries(pkceParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  return url.toString();
};

/**
 * Creates a new authorization state for starting OAuth flow.
 * @param redirectUri - Redirect URI for callback
 * @returns Authorization state object
 */
export const createAuthorizationState = (redirectUri: string): AuthorizationState => ({
  state: generateState(),
  pkce: generatePkceParams(),
  redirectUri,
  createdAt: Date.now(),
});

/**
 * Validates the state parameter from callback.
 * @param expected - Expected state value
 * @param received - Received state value
 * @returns True if states match
 */
export const validateState = (expected: string, received: string): boolean =>
  expected === received;

/**
 * Checks if authorization state has expired.
 * @param state - Authorization state
 * @param maxAgeMs - Maximum age in milliseconds (default: 10 minutes)
 * @returns True if state has expired
 */
export const isStateExpired = (
  state: AuthorizationState,
  maxAgeMs: number = 10 * 60 * 1000
): boolean => Date.now() - state.createdAt > maxAgeMs;

/**
 * Builds the token request body for authorization code exchange.
 * @param config - OAuth configuration
 * @param code - Authorization code
 * @param state - Authorization state
 * @returns Token request body
 */
export const buildTokenRequestBody = (
  config: OAuthConfig,
  code: string,
  state: AuthorizationState
): Record<string, string> => {
  const body: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: state.redirectUri,
    client_id: config.clientId,
  };
  
  if (config.clientSecret) {
    body.client_secret = config.clientSecret;
  }
  
  if (config.pkce !== false) {
    Object.assign(body, pkceToTokenParams(state.pkce.codeVerifier));
  }
  
  return body;
};

/**
 * Builds the token request body for client credentials flow.
 * @param config - OAuth configuration
 * @returns Token request body
 */
export const buildClientCredentialsBody = (
  config: OAuthConfig
): Record<string, string> => {
  const body: Record<string, string> = {
    grant_type: 'client_credentials',
    client_id: config.clientId,
    client_secret: config.clientSecret,
  };
  
  if (config.scopes.length > 0) {
    body.scope = config.scopes.join(' ');
  }
  
  return body;
};

/**
 * Builds the token request body for refresh token flow.
 * @param config - OAuth configuration
 * @param refreshToken - Refresh token
 * @returns Token request body
 */
export const buildRefreshTokenBody = (
  config: OAuthConfig,
  refreshToken: string
): Record<string, string> => ({
  grant_type: 'refresh_token',
  refresh_token: refreshToken,
  client_id: config.clientId,
  client_secret: config.clientSecret,
});

/**
 * Parses and validates a token response.
 * @param response - Raw response data
 * @returns Result containing TokenSet or error
 */
export const parseTokenResponse = (
  response: unknown
): Result<TokenSet, OAuthError> => {
  if (!response || typeof response !== 'object') {
    return err(oauthError('Invalid token response format'));
  }
  
  const data = response as Record<string, unknown>;
  
  if (data.error) {
    const errorDesc = data.error_description as string | undefined;
    return err(
      oauthError(
        errorDesc ?? String(data.error),
        data.error as string
      )
    );
  }
  
  if (!data.access_token || typeof data.access_token !== 'string') {
    return err(oauthError('Missing access_token in response'));
  }
  
  const tokenSet: TokenSet = {
    accessToken: data.access_token,
    tokenType: (data.token_type as string) ?? 'Bearer',
    expiresAt: data.expires_in
      ? Date.now() + (data.expires_in as number) * 1000
      : undefined,
    refreshToken: data.refresh_token as string | undefined,
    scope: data.scope as string | undefined,
  };
  
  return ok(tokenSet);
};

/**
 * Checks if a token is expired or about to expire.
 * @param token - Token set to check
 * @param bufferMs - Buffer time before actual expiry (default: 30 seconds)
 * @returns True if token is expired or about to expire
 */
export const isTokenExpired = (
  token: TokenSet,
  bufferMs: number = 30 * 1000
): boolean => {
  if (!token.expiresAt) return false;
  return Date.now() >= token.expiresAt - bufferMs;
};

/**
 * Checks if a token can be refreshed.
 * @param token - Token set to check
 * @returns True if refresh token is available
 */
export const canRefreshToken = (token: TokenSet): boolean =>
  token.refreshToken !== undefined && token.refreshToken !== null;

/**
 * Creates the Authorization header value from a token.
 * @param token - Token set
 * @returns Authorization header value
 */
export const createAuthHeader = (token: TokenSet): string =>
  `${token.tokenType} ${token.accessToken}`;

/**
 * Extracts scopes from a token as an array.
 * @param token - Token set
 * @returns Array of scope strings
 */
export const getTokenScopes = (token: TokenSet): string[] =>
  token.scope ? token.scope.split(' ').filter((s) => s.length > 0) : [];

/**
 * Checks if a token has a specific scope.
 * @param token - Token set
 * @param scope - Scope to check for
 * @returns True if token has the scope
 */
export const hasScope = (token: TokenSet, scope: string): boolean =>
  getTokenScopes(token).includes(scope);

/**
 * Validates OAuth configuration.
 * @param config - OAuth configuration to validate
 * @returns Result containing config or error
 */
export const validateOAuthConfig = (
  config: OAuthConfig
): Result<OAuthConfig, OAuthError> => {
  if (!config.clientId) {
    return err(oauthError('Missing clientId in OAuth configuration'));
  }
  
  if (!config.authorizationUrl) {
    return err(oauthError('Missing authorizationUrl in OAuth configuration'));
  }
  
  if (!config.tokenUrl) {
    return err(oauthError('Missing tokenUrl in OAuth configuration'));
  }
  
  try {
    new URL(config.authorizationUrl);
    new URL(config.tokenUrl);
  } catch {
    return err(oauthError('Invalid URL in OAuth configuration'));
  }
  
  return ok(config);
};

/**
 * Pipeline for validating and building authorization URL.
 * @param config - OAuth configuration
 * @param redirectUri - Redirect URI
 * @returns Result containing auth URL and state
 */
export const initializeAuthFlow = (
  config: OAuthConfig,
  redirectUri: string
): Result<{ url: string; state: AuthorizationState }, OAuthError> => {
  const validationResult = validateOAuthConfig(config);
  
  if (validationResult._tag === 'Err') {
    return validationResult;
  }
  
  const state = createAuthorizationState(redirectUri);
  const url = buildAuthorizationUrl(config, state);
  
  return ok({ url, state });
};
