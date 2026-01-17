/**
 * Express middleware for OAuth authentication.
 * Provides middleware functions for protecting MCP server routes.
 * @module auth/middleware
 */
import { ok, err } from '../core/result.js';
import { oauthError } from '../core/errors.js';
import { hasScope } from './oauth.js';
/**
 * Extracts Bearer token from Authorization header.
 * @param authHeader - Authorization header value
 * @returns Token string or undefined
 */
export const extractBearerToken = (authHeader) => {
    if (!authHeader)
        return undefined;
    const parts = authHeader.split(' ');
    if (parts.length !== 2)
        return undefined;
    if (parts[0].toLowerCase() !== 'bearer')
        return undefined;
    return parts[1];
};
/**
 * Extracts token from request (header or query).
 * @param req - Express request
 * @returns Token string or undefined
 */
export const extractToken = (req) => {
    const headerToken = extractBearerToken(req.headers.authorization);
    if (headerToken)
        return headerToken;
    const queryToken = req.query.access_token;
    if (typeof queryToken === 'string')
        return queryToken;
    return undefined;
};
/**
 * Creates a simple token validator that checks format.
 * For production, use a proper JWT validator or introspection endpoint.
 * @returns Token validator function
 */
export const createSimpleValidator = () => async (token) => {
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
export const createAuthMiddleware = (validator) => async (req, res, next) => {
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
export const requireScopes = (...requiredScopes) => (req, res, next) => {
    const token = req.token;
    if (!token) {
        res.status(401).json({
            error: 'unauthorized',
            error_description: 'Authentication required',
        });
        return;
    }
    const missingScopes = requiredScopes.filter((scope) => !hasScope(token, scope));
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
export const optionalAuth = (validator) => async (req, _res, next) => {
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
export const createApiKeyMiddleware = (validApiKeys, headerName = 'X-API-Key') => (req, res, next) => {
    const apiKey = req.headers[headerName.toLowerCase()];
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
export const createFlexibleAuthMiddleware = (config, validator) => {
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
export const authErrorHandler = () => (error, _req, res, next) => {
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
export const createOAuthCorsHeaders = () => ({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
});
//# sourceMappingURL=middleware.js.map