/**
 * Express middleware for OAuth authentication.
 * Provides middleware functions for protecting MCP server routes.
 * @module auth/middleware
 */
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { Result } from '../core/result.js';
import { type OAuthError } from '../core/errors.js';
import type { TokenSet, AuthConfig } from '../core/types.js';
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
export declare const extractBearerToken: (authHeader: string | undefined) => string | undefined;
/**
 * Extracts token from request (header or query).
 * @param req - Express request
 * @returns Token string or undefined
 */
export declare const extractToken: (req: Request) => string | undefined;
/**
 * Creates a simple token validator that checks format.
 * For production, use a proper JWT validator or introspection endpoint.
 * @returns Token validator function
 */
export declare const createSimpleValidator: () => TokenValidator;
/**
 * Creates authentication middleware.
 * @param validator - Token validator function
 * @returns Express middleware
 */
export declare const createAuthMiddleware: (validator: TokenValidator) => RequestHandler;
/**
 * Creates scope-checking middleware.
 * @param requiredScopes - Scopes required for access
 * @returns Express middleware
 */
export declare const requireScopes: (...requiredScopes: string[]) => RequestHandler;
/**
 * Creates optional authentication middleware.
 * Attaches token if present but doesn't require it.
 * @param validator - Token validator function
 * @returns Express middleware
 */
export declare const optionalAuth: (validator: TokenValidator) => RequestHandler;
/**
 * Creates API key authentication middleware.
 * @param validApiKeys - Set of valid API keys
 * @param headerName - Header name for API key (default: X-API-Key)
 * @returns Express middleware
 */
export declare const createApiKeyMiddleware: (validApiKeys: Set<string>, headerName?: string) => RequestHandler;
/**
 * Creates combined auth middleware that supports multiple auth methods.
 * @param config - Authentication configuration
 * @param validator - OAuth token validator
 * @returns Express middleware
 */
export declare const createFlexibleAuthMiddleware: (config: AuthConfig, validator?: TokenValidator) => RequestHandler;
/**
 * Error handler middleware for auth errors.
 * @returns Express error handler middleware
 */
export declare const authErrorHandler: () => (error: Error, _req: Request, res: Response, next: NextFunction) => void;
/**
 * Creates CORS headers for OAuth endpoints.
 * @returns Headers object
 */
export declare const createOAuthCorsHeaders: () => Record<string, string>;
//# sourceMappingURL=middleware.d.ts.map