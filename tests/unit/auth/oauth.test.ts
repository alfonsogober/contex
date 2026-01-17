import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildAuthorizationUrl,
  createAuthorizationState,
  validateState,
  isStateExpired,
  buildTokenRequestBody,
  buildClientCredentialsBody,
  buildRefreshTokenBody,
  parseTokenResponse,
  isTokenExpired,
  canRefreshToken,
  createAuthHeader,
  getTokenScopes,
  hasScope,
  validateOAuthConfig,
  initializeAuthFlow,
} from '../../../src/auth/oauth.js';
import { isOk, isErr } from '../../../src/core/result.js';
import type { OAuthConfig, TokenSet } from '../../../src/core/types.js';

describe('OAuth utilities', () => {
  const testConfig: OAuthConfig = {
    type: 'oauth2',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    authorizationUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/token',
    scopes: ['read', 'write'],
    pkce: true,
  };

  describe('createAuthorizationState', () => {
    it('creates state with all required fields', () => {
      const state = createAuthorizationState('https://app.com/callback');
      expect(state.state).toBeDefined();
      expect(state.pkce).toBeDefined();
      expect(state.redirectUri).toBe('https://app.com/callback');
      expect(state.createdAt).toBeGreaterThan(0);
    });

    it('generates unique states', () => {
      const state1 = createAuthorizationState('https://app.com/callback');
      const state2 = createAuthorizationState('https://app.com/callback');
      expect(state1.state).not.toBe(state2.state);
    });
  });

  describe('buildAuthorizationUrl', () => {
    it('includes required parameters', () => {
      const state = createAuthorizationState('https://app.com/callback');
      const url = buildAuthorizationUrl(testConfig, state);
      
      expect(url).toContain('response_type=code');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('state=');
    });

    it('includes scopes', () => {
      const state = createAuthorizationState('https://app.com/callback');
      const url = buildAuthorizationUrl(testConfig, state);
      expect(url).toContain('scope=read+write');
    });

    it('includes PKCE parameters when enabled', () => {
      const state = createAuthorizationState('https://app.com/callback');
      const url = buildAuthorizationUrl(testConfig, state);
      expect(url).toContain('code_challenge=');
      expect(url).toContain('code_challenge_method=S256');
    });

    it('omits PKCE when disabled', () => {
      const noPkce = { ...testConfig, pkce: false };
      const state = createAuthorizationState('https://app.com/callback');
      const url = buildAuthorizationUrl(noPkce, state);
      expect(url).not.toContain('code_challenge');
    });
  });

  describe('validateState', () => {
    it('returns true for matching states', () => {
      expect(validateState('abc123', 'abc123')).toBe(true);
    });

    it('returns false for different states', () => {
      expect(validateState('abc123', 'xyz789')).toBe(false);
    });
  });

  describe('isStateExpired', () => {
    it('returns false for fresh state', () => {
      const state = createAuthorizationState('https://app.com/callback');
      expect(isStateExpired(state)).toBe(false);
    });

    it('returns true for expired state', () => {
      const state = {
        ...createAuthorizationState('https://app.com/callback'),
        createdAt: Date.now() - 15 * 60 * 1000,
      };
      expect(isStateExpired(state)).toBe(true);
    });

    it('respects custom maxAge', () => {
      const state = {
        ...createAuthorizationState('https://app.com/callback'),
        createdAt: Date.now() - 5000,
      };
      expect(isStateExpired(state, 1000)).toBe(true);
      expect(isStateExpired(state, 10000)).toBe(false);
    });
  });

  describe('buildTokenRequestBody', () => {
    it('includes required fields', () => {
      const state = createAuthorizationState('https://app.com/callback');
      const body = buildTokenRequestBody(testConfig, 'auth-code-123', state);
      
      expect(body.grant_type).toBe('authorization_code');
      expect(body.code).toBe('auth-code-123');
      expect(body.redirect_uri).toBe('https://app.com/callback');
      expect(body.client_id).toBe('test-client-id');
    });

    it('includes client_secret', () => {
      const state = createAuthorizationState('https://app.com/callback');
      const body = buildTokenRequestBody(testConfig, 'auth-code-123', state);
      expect(body.client_secret).toBe('test-client-secret');
    });

    it('includes code_verifier for PKCE', () => {
      const state = createAuthorizationState('https://app.com/callback');
      const body = buildTokenRequestBody(testConfig, 'auth-code-123', state);
      expect(body.code_verifier).toBe(state.pkce.codeVerifier);
    });
  });

  describe('buildClientCredentialsBody', () => {
    it('builds correct body', () => {
      const body = buildClientCredentialsBody(testConfig);
      expect(body.grant_type).toBe('client_credentials');
      expect(body.client_id).toBe('test-client-id');
      expect(body.client_secret).toBe('test-client-secret');
      expect(body.scope).toBe('read write');
    });
  });

  describe('buildRefreshTokenBody', () => {
    it('builds correct body', () => {
      const body = buildRefreshTokenBody(testConfig, 'refresh-token-123');
      expect(body.grant_type).toBe('refresh_token');
      expect(body.refresh_token).toBe('refresh-token-123');
      expect(body.client_id).toBe('test-client-id');
      expect(body.client_secret).toBe('test-client-secret');
    });
  });

  describe('parseTokenResponse', () => {
    it('parses valid response', () => {
      const response = {
        access_token: 'access-123',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh-456',
        scope: 'read write',
      };
      
      const result = parseTokenResponse(response);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.accessToken).toBe('access-123');
        expect(result.value.tokenType).toBe('Bearer');
        expect(result.value.refreshToken).toBe('refresh-456');
        expect(result.value.scope).toBe('read write');
        expect(result.value.expiresAt).toBeDefined();
      }
    });

    it('returns error for missing access_token', () => {
      const result = parseTokenResponse({ token_type: 'Bearer' });
      expect(isErr(result)).toBe(true);
    });

    it('returns error for error response', () => {
      const result = parseTokenResponse({
        error: 'invalid_grant',
        error_description: 'The authorization code has expired',
      });
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain('expired');
      }
    });

    it('returns error for invalid format', () => {
      const result = parseTokenResponse(null);
      expect(isErr(result)).toBe(true);
    });
  });

  describe('isTokenExpired', () => {
    it('returns false for unexpired token', () => {
      const token: TokenSet = {
        accessToken: 'test',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
      };
      expect(isTokenExpired(token)).toBe(false);
    });

    it('returns true for expired token', () => {
      const token: TokenSet = {
        accessToken: 'test',
        tokenType: 'Bearer',
        expiresAt: Date.now() - 1000,
      };
      expect(isTokenExpired(token)).toBe(true);
    });

    it('returns true within buffer period', () => {
      const token: TokenSet = {
        accessToken: 'test',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 10000,
      };
      expect(isTokenExpired(token, 30000)).toBe(true);
    });

    it('returns false for token without expiry', () => {
      const token: TokenSet = {
        accessToken: 'test',
        tokenType: 'Bearer',
      };
      expect(isTokenExpired(token)).toBe(false);
    });
  });

  describe('canRefreshToken', () => {
    it('returns true when refresh token exists', () => {
      const token: TokenSet = {
        accessToken: 'test',
        tokenType: 'Bearer',
        refreshToken: 'refresh-123',
      };
      expect(canRefreshToken(token)).toBe(true);
    });

    it('returns false when no refresh token', () => {
      const token: TokenSet = {
        accessToken: 'test',
        tokenType: 'Bearer',
      };
      expect(canRefreshToken(token)).toBe(false);
    });
  });

  describe('createAuthHeader', () => {
    it('creates correct header value', () => {
      const token: TokenSet = {
        accessToken: 'test-token',
        tokenType: 'Bearer',
      };
      expect(createAuthHeader(token)).toBe('Bearer test-token');
    });
  });

  describe('getTokenScopes', () => {
    it('parses scope string to array', () => {
      const token: TokenSet = {
        accessToken: 'test',
        tokenType: 'Bearer',
        scope: 'read write admin',
      };
      expect(getTokenScopes(token)).toEqual(['read', 'write', 'admin']);
    });

    it('returns empty array for no scope', () => {
      const token: TokenSet = {
        accessToken: 'test',
        tokenType: 'Bearer',
      };
      expect(getTokenScopes(token)).toEqual([]);
    });
  });

  describe('hasScope', () => {
    it('returns true when scope exists', () => {
      const token: TokenSet = {
        accessToken: 'test',
        tokenType: 'Bearer',
        scope: 'read write',
      };
      expect(hasScope(token, 'read')).toBe(true);
    });

    it('returns false when scope missing', () => {
      const token: TokenSet = {
        accessToken: 'test',
        tokenType: 'Bearer',
        scope: 'read write',
      };
      expect(hasScope(token, 'admin')).toBe(false);
    });
  });

  describe('validateOAuthConfig', () => {
    it('returns Ok for valid config', () => {
      const result = validateOAuthConfig(testConfig);
      expect(isOk(result)).toBe(true);
    });

    it('returns Err for missing clientId', () => {
      const invalid = { ...testConfig, clientId: '' };
      const result = validateOAuthConfig(invalid);
      expect(isErr(result)).toBe(true);
    });

    it('returns Err for invalid URL', () => {
      const invalid = { ...testConfig, authorizationUrl: 'not-a-url' };
      const result = validateOAuthConfig(invalid);
      expect(isErr(result)).toBe(true);
    });
  });

  describe('initializeAuthFlow', () => {
    it('returns url and state for valid config', () => {
      const result = initializeAuthFlow(testConfig, 'https://app.com/callback');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.url).toContain('https://auth.example.com/authorize');
        expect(result.value.state).toBeDefined();
      }
    });

    it('returns Err for invalid config', () => {
      const invalid = { ...testConfig, clientId: '' };
      const result = initializeAuthFlow(invalid, 'https://app.com/callback');
      expect(isErr(result)).toBe(true);
    });
  });
});
