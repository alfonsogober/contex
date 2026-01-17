/**
 * Express middleware for OAuth authentication.
 * Provides middleware functions for protecting MCP server routes.
 * @module auth/middleware
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { Result, ok, err } from '../core/result.js';
import { oauthError, type OAuthError } from '../core/errors.js';
import type { TokenSet, AuthConfig } from '../core/types.js';
import { hasScope } from './oauth.js';

/**
 * Extended Express Request with auth information.
 */
export interface AuthenticatedRequest extends Request {
  token?: TokenSet;
  userId?: string;
}

/**
 * Token validator function type.
 */
export type TokenValidator = (token: string) => Promise<Result<TokenSet, OAuthError>>;

/**
 * Extracts Bearer token from Authorization header.
 * @param authHeader - Authorization header value
 * @returns Token string or undefined
 */
export const extractBearerToken = (authHeader: string | undefined): string | undefined => {
  if (!authHeader) return undefined;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return undefined;
  if (parts[0].toLowerCase() !== 'bearer') return undefined;
  
  return parts[1];
};

/**
 * Extracts token from request (header or query).
 * @param req - Express request
 * @returns Token string or undefined
 */
export const extractToken = (req: Request): string | undefined => {
  const headerToken = extractBearerToken(req.headers.authorization);
  if (headerToken) return headerToken;
  
  const queryToken = req.query.access_token;
  if (typeof queryToken === 'string') return queryToken;
  
  return undefined;
};

/**
 * Creates a simple token validator that checks format.
 * For production, use a proper JWT validator or introspection endpoint.
 * @returns Token validator function
 */
export const createSimpleValidator = (): TokenValidator =>
  async (token: string): Promise<Result<TokenSet, OAuthError>> => {
    if (!token || token.length < 10) {
      return err(oauthError('Invalid token format'));
    }
    
    return ok({
      accessToken: token,
      tokenType: 'Bearer',
    });
  };

/**
 * Creates authentication middleware.
 * @param validator - Token validator function
 * @returns Express middleware
 */
export const createAuthMiddleware = (
  validator: TokenValidator
): RequestHandler =>
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req);
    
    if (!token) {
      res.status(401).json({
        error: 'unauthorized',
        error_description: 'Missing authentication token',
      });
      return;
    }
    
    const validationResult = await validator(token);
    
    if (validationResult._tag === 'Err') {
      res.status(401).json({
        error: 'invalid_token',
        error_description: validationResult.error.message,
      });
      return;
    }
    
    req.token = validationResult.value;
    next();
  };

/**
 * Creates scope-checking middleware.
 * @param requiredScopes - Scopes required for access
 * @returns Express middleware
 */
export const requireScopes = (
  ...requiredScopes: string[]
): RequestHandler =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const token = req.token;
    
    if (!token) {
      res.status(401).json({
        error: 'unauthorized',
        error_description: 'Authentication required',
      });
      return;
    }
    
    const missingScopes = requiredScopes.filter(
      (scope) => !hasScope(token, scope)
    );
    
    if (missingScopes.length > 0) {
      res.status(403).json({
        error: 'insufficient_scope',
        error_description: `Missing required scopes: ${missingScopes.join(', ')}`,
      });
      return;
    }
    
    next();
  };

/**
 * Creates optional authentication middleware.
 * Attaches token if present but doesn't require it.
 * @param validator - Token validator function
 * @returns Express middleware
 */
export const optionalAuth = (
  validator: TokenValidator
): RequestHandler =>
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req);
    
    if (!token) {
      next();
      return;
    }
    
    const validationResult = await validator(token);
    
    if (validationResult._tag === 'Ok') {
      req.token = validationResult.value;
    }
    
    next();
  };

/**
 * Creates API key authentication middleware.
 * @param validApiKeys - Set of valid API keys
 * @param headerName - Header name for API key (default: X-API-Key)
 * @returns Express middleware
 */
export const createApiKeyMiddleware = (
  validApiKeys: Set<string>,
  headerName = 'X-API-Key'
): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers[headerName.toLowerCase()] as string | undefined;
    
    if (!apiKey) {
      res.status(401).json({
        error: 'unauthorized',
        error_description: `Missing ${headerName} header`,
      });
      return;
    }
    
    if (!validApiKeys.has(apiKey)) {
      res.status(401).json({
        error: 'invalid_api_key',
        error_description: 'Invalid API key',
      });
      return;
    }
    
    next();
  };

/**
 * Creates combined auth middleware that supports multiple auth methods.
 * @param config - Authentication configuration
 * @param validator - OAuth token validator
 * @returns Express middleware
 */
export const createFlexibleAuthMiddleware = (
  config: AuthConfig,
  validator?: TokenValidator
): RequestHandler => {
  switch (config.type) {
    case 'oauth2':
      return createAuthMiddleware(validator ?? createSimpleValidator());
    
    case 'apiKey':
      return createApiKeyMiddleware(new Set([config.key]), config.headerName);
    
    case 'bearer':
      return createAuthMiddleware(async (token) => {
        if (token === config.token) {
          return ok({ accessToken: token, tokenType: 'Bearer' });
        }
        return err(oauthError('Invalid bearer token'));
      });
  }
};

/**
 * Error handler middleware for auth errors.
 * @returns Express error handler middleware
 */
export const authErrorHandler = () =>
  (error: Error, _req: Request, res: Response, next: NextFunction): void => {
    if (res.headersSent) {
      next(error);
      return;
    }
    
    if (error.name === 'UnauthorizedError') {
      res.status(401).json({
        error: 'unauthorized',
        error_description: error.message,
      });
      return;
    }
    
    next(error);
  };

/**
 * Creates CORS headers for OAuth endpoints.
 * @returns Headers object
 */
export const createOAuthCorsHeaders = (): Record<string, string> => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
});
