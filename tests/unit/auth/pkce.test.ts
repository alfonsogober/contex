import { describe, it, expect } from 'vitest';
import {
  generateCodeVerifier,
  computeCodeChallenge,
  generatePkceParams,
  validateCodeVerifier,
  isValidCodeVerifier,
  isValidCodeChallenge,
  pkceToQueryParams,
  pkceToTokenParams,
  generateState,
  generateNonce,
  base64UrlEncode,
} from '../../../src/auth/pkce.js';

describe('PKCE utilities', () => {
  describe('generateCodeVerifier', () => {
    it('generates a 64-character verifier', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toHaveLength(64);
    });

    it('only uses allowed characters', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    });

    it('generates unique verifiers', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe('computeCodeChallenge', () => {
    it('produces consistent output for same input', () => {
      const verifier = 'test_verifier_string_with_sufficient_length_for_testing';
      const challenge1 = computeCodeChallenge(verifier);
      const challenge2 = computeCodeChallenge(verifier);
      expect(challenge1).toBe(challenge2);
    });

    it('produces base64url encoded output', () => {
      const verifier = generateCodeVerifier();
      const challenge = computeCodeChallenge(verifier);
      expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
      expect(challenge).not.toContain('+');
      expect(challenge).not.toContain('/');
      expect(challenge).not.toContain('=');
    });

    it('produces 43-character output (SHA-256 base64url)', () => {
      const verifier = generateCodeVerifier();
      const challenge = computeCodeChallenge(verifier);
      expect(challenge).toHaveLength(43);
    });
  });

  describe('generatePkceParams', () => {
    it('returns complete PKCE parameters', () => {
      const params = generatePkceParams();
      expect(params.codeVerifier).toBeDefined();
      expect(params.codeChallenge).toBeDefined();
      expect(params.codeChallengeMethod).toBe('S256');
    });

    it('generates matching verifier and challenge', () => {
      const params = generatePkceParams();
      const recomputed = computeCodeChallenge(params.codeVerifier);
      expect(recomputed).toBe(params.codeChallenge);
    });
  });

  describe('validateCodeVerifier', () => {
    it('returns true for matching verifier and challenge', () => {
      const params = generatePkceParams();
      expect(validateCodeVerifier(params.codeVerifier, params.codeChallenge)).toBe(true);
    });

    it('returns false for non-matching verifier', () => {
      const params = generatePkceParams();
      const wrongVerifier = generateCodeVerifier();
      expect(validateCodeVerifier(wrongVerifier, params.codeChallenge)).toBe(false);
    });
  });

  describe('isValidCodeVerifier', () => {
    it('returns true for valid verifiers', () => {
      const verifier = generateCodeVerifier();
      expect(isValidCodeVerifier(verifier)).toBe(true);
    });

    it('returns false for too short verifiers', () => {
      expect(isValidCodeVerifier('short')).toBe(false);
    });

    it('returns false for too long verifiers', () => {
      const tooLong = 'a'.repeat(129);
      expect(isValidCodeVerifier(tooLong)).toBe(false);
    });

    it('returns false for invalid characters', () => {
      const invalid = 'a'.repeat(43) + '!@#';
      expect(isValidCodeVerifier(invalid)).toBe(false);
    });

    it('accepts minimum length (43 chars)', () => {
      const minLength = 'a'.repeat(43);
      expect(isValidCodeVerifier(minLength)).toBe(true);
    });

    it('accepts maximum length (128 chars)', () => {
      const maxLength = 'a'.repeat(128);
      expect(isValidCodeVerifier(maxLength)).toBe(true);
    });
  });

  describe('isValidCodeChallenge', () => {
    it('returns true for valid challenges', () => {
      const params = generatePkceParams();
      expect(isValidCodeChallenge(params.codeChallenge)).toBe(true);
    });

    it('returns false for wrong length', () => {
      expect(isValidCodeChallenge('tooshort')).toBe(false);
      expect(isValidCodeChallenge('a'.repeat(44))).toBe(false);
    });

    it('returns false for invalid characters', () => {
      const invalid = 'a'.repeat(42) + '+';
      expect(isValidCodeChallenge(invalid)).toBe(false);
    });
  });

  describe('pkceToQueryParams', () => {
    it('returns correct query parameters', () => {
      const params = generatePkceParams();
      const query = pkceToQueryParams(params);
      expect(query.code_challenge).toBe(params.codeChallenge);
      expect(query.code_challenge_method).toBe('S256');
    });
  });

  describe('pkceToTokenParams', () => {
    it('returns code_verifier parameter', () => {
      const verifier = generateCodeVerifier();
      const tokenParams = pkceToTokenParams(verifier);
      expect(tokenParams.code_verifier).toBe(verifier);
    });
  });

  describe('generateState', () => {
    it('generates a non-empty string', () => {
      const state = generateState();
      expect(state.length).toBeGreaterThan(0);
    });

    it('generates unique states', () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
    });

    it('uses base64url encoding', () => {
      const state = generateState();
      expect(state).toMatch(/^[A-Za-z0-9\-_]+$/);
    });
  });

  describe('generateNonce', () => {
    it('generates a non-empty string', () => {
      const nonce = generateNonce();
      expect(nonce.length).toBeGreaterThan(0);
    });

    it('generates unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('base64UrlEncode', () => {
    it('encodes buffer to base64url', () => {
      const buffer = Buffer.from('hello world');
      const encoded = base64UrlEncode(buffer);
      expect(encoded).toBe('aGVsbG8gd29ybGQ');
    });

    it('removes padding', () => {
      const buffer = Buffer.from('a');
      const encoded = base64UrlEncode(buffer);
      expect(encoded).not.toContain('=');
    });

    it('replaces + with -', () => {
      const buffer = Buffer.from([0xfb]);
      const encoded = base64UrlEncode(buffer);
      expect(encoded).not.toContain('+');
    });

    it('replaces / with _', () => {
      const buffer = Buffer.from([0xff]);
      const encoded = base64UrlEncode(buffer);
      expect(encoded).not.toContain('/');
    });
  });
});
