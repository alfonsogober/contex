/**
 * Custom error types for the MCP library.
 * Uses discriminated unions for type-safe error handling.
 * @module core/errors
 */
/** Creates a ParseError */
export const parseError = (message, source, details) => ({
    _tag: 'ParseError',
    message,
    source,
    details,
});
/** Creates a ConfigError */
export const configError = (message, field) => ({
    _tag: 'ConfigError',
    message,
    field,
});
/** Creates a SchemaError */
export const schemaError = (message, schemaPath, schemaType) => ({
    _tag: 'SchemaError',
    message,
    schemaPath,
    schemaType,
});
/** Creates an OAuthError */
export const oauthError = (message, code, statusCode) => ({
    _tag: 'OAuthError',
    message,
    code,
    statusCode,
});
/** Creates a TokenError */
export const tokenError = (message, tokenType) => ({
    _tag: 'TokenError',
    message,
    tokenType,
});
/** Creates an HttpError */
export const httpError = (message, statusCode, url, method) => ({
    _tag: 'HttpError',
    message,
    statusCode,
    url,
    method,
});
/** Creates a ToolError */
export const toolError = (message, toolName, cause) => ({
    _tag: 'ToolError',
    message,
    toolName,
    cause,
});
/** Creates a ServerError */
export const serverError = (message, code) => ({
    _tag: 'ServerError',
    message,
    code,
});
/** Creates a ValidationError */
export const validationError = (message, path, expected, received) => ({
    _tag: 'ValidationError',
    message,
    path,
    expected,
    received,
});
/** Type guard for ParseError */
export const isParseError = (e) => e._tag === 'ParseError';
/** Type guard for ConfigError */
export const isConfigError = (e) => e._tag === 'ConfigError';
/** Type guard for SchemaError */
export const isSchemaError = (e) => e._tag === 'SchemaError';
/** Type guard for OAuthError */
export const isOAuthError = (e) => e._tag === 'OAuthError';
/** Type guard for TokenError */
export const isTokenError = (e) => e._tag === 'TokenError';
/** Type guard for HttpError */
export const isHttpError = (e) => e._tag === 'HttpError';
/** Type guard for ToolError */
export const isToolError = (e) => e._tag === 'ToolError';
/** Type guard for ServerError */
export const isServerError = (e) => e._tag === 'ServerError';
/** Type guard for ValidationError */
export const isValidationError = (e) => e._tag === 'ValidationError';
/** Formats an error for display */
export const formatError = (error) => {
    switch (error._tag) {
        case 'ParseError':
            return `Parse Error: ${error.message}${error.source ? ` (source: ${error.source})` : ''}`;
        case 'ConfigError':
            return `Config Error: ${error.message}${error.field ? ` (field: ${error.field})` : ''}`;
        case 'SchemaError':
            return `Schema Error: ${error.message}${error.schemaPath ? ` (path: ${error.schemaPath})` : ''}`;
        case 'OAuthError':
            return `OAuth Error: ${error.message}${error.code ? ` (code: ${error.code})` : ''}`;
        case 'TokenError':
            return `Token Error: ${error.message}`;
        case 'HttpError':
            return `HTTP Error ${error.statusCode}: ${error.message}${error.url ? ` (${error.method} ${error.url})` : ''}`;
        case 'ToolError':
            return `Tool Error [${error.toolName}]: ${error.message}`;
        case 'ServerError':
            return `Server Error: ${error.message}${error.code ? ` (code: ${error.code})` : ''}`;
        case 'ValidationError':
            return `Validation Error: ${error.message}${error.path ? ` (path: ${error.path})` : ''}`;
    }
};
//# sourceMappingURL=errors.js.map