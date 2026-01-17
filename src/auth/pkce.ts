/**
 * PKCE (Proof Key for Code Exchange) implementation.
 * Provides secure code challenge generation for OAuth 2.1.
 * @module auth/pkce
 */

import { createHash, randomBytes } from 'crypto';
import type { PkceParams } from '../core/types.js';

export type { PkceParams };

const CODE_VERIFIER_LENGTH = 64;
const CODE_VERIFIER_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

/**
 * Generates a cryptographically random code verifier.
 * Uses the allowed character set from RFC 7636.
 * @returns Random code verifier string
 */
export const generateCodeVerifier = (): string => {
  const bytes = randomBytes(CODE_VERIFIER_LENGTH);
  const chars: string[] = [];
  
  for (let i = 0; i < CODE_VERIFIER_LENGTH; i++) {
    chars.push(CODE_VERIFIER_CHARSET[bytes[i] % CODE_VERIFIER_CHARSET.length]);
  }
  
  return chars.join('');
};

/**
 * Encodes bytes to base64url format (URL-safe base64 without padding).
 * @param buffer - Buffer to encode
 * @returns Base64url encoded string
 */
export const base64UrlEncode = (buffer: Buffer): string =>
  buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

/**
 * Computes the S256 code challenge from a code verifier.
 * Uses SHA-256 hash and base64url encoding per RFC 7636.
 * @param verifier - Code verifier string
 * @returns Code challenge string
 */
export const computeCodeChallenge = (verifier: string): string => {
  const hash = createHash('sha256').update(verifier).digest();
  return base64UrlEncode(hash);
};

/**
 * Generates a complete PKCE parameter set.
 * @returns Object containing verifier, challenge, and method
 */
export const generatePkceParams = (): PkceParams => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = computeCodeChallenge(codeVerifier);
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
};

/**
 * Validates a code verifier against a code challenge.
 * Used by authorization servers to verify PKCE.
 * @param verifier - Code verifier to validate
 * @param challenge - Expected code challenge
 * @returns True if verifier matches challenge
 */
export const validateCodeVerifier = (
  verifier: string,
  challenge: string
): boolean => computeCodeChallenge(verifier) === challenge;

/**
 * Validates that a code verifier meets RFC 7636 requirements.
 * Must be 43-128 characters using unreserved URI characters.
 * @param verifier - Code verifier to validate
 * @returns True if verifier is valid
 */
export const isValidCodeVerifier = (verifier: string): boolean => {
  if (verifier.length < 43 || verifier.length > 128) return false;
  return /^[A-Za-z0-9\-._~]+$/.test(verifier);
};

/**
 * Validates that a code challenge is properly formatted.
 * @param challenge - Code challenge to validate
 * @returns True if challenge is valid base64url
 */
export const isValidCodeChallenge = (challenge: string): boolean => {
  if (challenge.length !== 43) return false;
  return /^[A-Za-z0-9\-_]+$/.test(challenge);
};

/**
 * Creates PKCE query parameters for the authorization URL.
 * @param params - PKCE parameters
 * @returns Query parameter object
 */
export const pkceToQueryParams = (
  params: PkceParams
): Record<string, string> => ({
  code_challenge: params.codeChallenge,
  code_challenge_method: params.codeChallengeMethod,
});

/**
 * Creates PKCE body parameters for the token request.
 * @param verifier - Code verifier
 * @returns Body parameter object
 */
export const pkceToTokenParams = (verifier: string): Record<string, string> => ({
  code_verifier: verifier,
});

/**
 * Generates a random state parameter for CSRF protection.
 * @returns Random state string
 */
export const generateState = (): string =>
  base64UrlEncode(randomBytes(32));

/**
 * Generates a random nonce for OpenID Connect.
 * @returns Random nonce string
 */
export const generateNonce = (): string =>
  base64UrlEncode(randomBytes(32));
