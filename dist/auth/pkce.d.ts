/**
 * PKCE (Proof Key for Code Exchange) implementation.
 * Provides secure code challenge generation for OAuth 2.1.
 * @module auth/pkce
 */
import type { PkceParams } from '../core/types.js';
export type { PkceParams };
/**
 * Generates a cryptographically random code verifier.
 * Uses the allowed character set from RFC 7636.
 * @returns Random code verifier string
 */
export declare const generateCodeVerifier: () => string;
/**
 * Encodes bytes to base64url format (URL-safe base64 without padding).
 * @param buffer - Buffer to encode
 * @returns Base64url encoded string
 */
export declare const base64UrlEncode: (buffer: Buffer) => string;
/**
 * Computes the S256 code challenge from a code verifier.
 * Uses SHA-256 hash and base64url encoding per RFC 7636.
 * @param verifier - Code verifier string
 * @returns Code challenge string
 */
export declare const computeCodeChallenge: (verifier: string) => string;
/**
 * Generates a complete PKCE parameter set.
 * @returns Object containing verifier, challenge, and method
 */
export declare const generatePkceParams: () => PkceParams;
/**
 * Validates a code verifier against a code challenge.
 * Used by authorization servers to verify PKCE.
 * @param verifier - Code verifier to validate
 * @param challenge - Expected code challenge
 * @returns True if verifier matches challenge
 */
export declare const validateCodeVerifier: (verifier: string, challenge: string) => boolean;
/**
 * Validates that a code verifier meets RFC 7636 requirements.
 * Must be 43-128 characters using unreserved URI characters.
 * @param verifier - Code verifier to validate
 * @returns True if verifier is valid
 */
export declare const isValidCodeVerifier: (verifier: string) => boolean;
/**
 * Validates that a code challenge is properly formatted.
 * @param challenge - Code challenge to validate
 * @returns True if challenge is valid base64url
 */
export declare const isValidCodeChallenge: (challenge: string) => boolean;
/**
 * Creates PKCE query parameters for the authorization URL.
 * @param params - PKCE parameters
 * @returns Query parameter object
 */
export declare const pkceToQueryParams: (params: PkceParams) => Record<string, string>;
/**
 * Creates PKCE body parameters for the token request.
 * @param verifier - Code verifier
 * @returns Body parameter object
 */
export declare const pkceToTokenParams: (verifier: string) => Record<string, string>;
/**
 * Generates a random state parameter for CSRF protection.
 * @returns Random state string
 */
export declare const generateState: () => string;
/**
 * Generates a random nonce for OpenID Connect.
 * @returns Random nonce string
 */
export declare const generateNonce: () => string;
//# sourceMappingURL=pkce.d.ts.map