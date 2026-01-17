/**
 * Custom error types for the MCP library.
 * Uses discriminated unions for type-safe error handling.
 * @module core/errors
 */
/** Base error interface with discriminator */
interface BaseError {
    readonly _tag: string;
    readonly message: string;
}
/** Error parsing OpenAPI specification */
export interface ParseError extends BaseError {
    readonly _tag: 'ParseError';
    readonly source?: string;
    readonly details?: unknown;
}
/** Error in configuration */
export interface ConfigError extends BaseError {
    readonly _tag: 'ConfigError';
    readonly field?: string;
}
/** Error in schema conversion */
export interface SchemaError extends BaseError {
    readonly _tag: 'SchemaError';
    readonly schemaPath?: string;
    readonly schemaType?: string;
}
/** Error in OAuth flow */
export interface OAuthError extends BaseError {
    readonly _tag: 'OAuthError';
    readonly code?: string;
    readonly statusCode?: number;
}
/** Error in token operations */
export interface TokenError extends BaseError {
    readonly _tag: 'TokenError';
    readonly tokenType?: string;
}
/** Error in HTTP operations */
export interface HttpError extends BaseError {
    readonly _tag: 'HttpError';
    readonly statusCode: number;
    readonly url?: string;
    readonly method?: string;
}
/** Error in tool execution */
export interface ToolError extends BaseError {
    readonly _tag: 'ToolError';
    readonly toolName: string;
    readonly cause?: unknown;
}
/** Error in server operations */
export interface ServerError extends BaseError {
    readonly _tag: 'ServerError';
    readonly code?: string;
}
/** Error in validation */
export interface ValidationError extends BaseError {
    readonly _tag: 'ValidationError';
    readonly path?: string;
    readonly expected?: string;
    readonly received?: string;
}
/** Union of all error types */
export type McpError = ParseError | ConfigError | SchemaError | OAuthError | TokenError | HttpError | ToolError | ServerError | ValidationError;
/** Creates a ParseError */
export declare const parseError: (message: string, source?: string, details?: unknown) => ParseError;
/** Creates a ConfigError */
export declare const configError: (message: string, field?: string) => ConfigError;
/** Creates a SchemaError */
export declare const schemaError: (message: string, schemaPath?: string, schemaType?: string) => SchemaError;
/** Creates an OAuthError */
export declare const oauthError: (message: string, code?: string, statusCode?: number) => OAuthError;
/** Creates a TokenError */
export declare const tokenError: (message: string, tokenType?: string) => TokenError;
/** Creates an HttpError */
export declare const httpError: (message: string, statusCode: number, url?: string, method?: string) => HttpError;
/** Creates a ToolError */
export declare const toolError: (message: string, toolName: string, cause?: unknown) => ToolError;
/** Creates a ServerError */
export declare const serverError: (message: string, code?: string) => ServerError;
/** Creates a ValidationError */
export declare const validationError: (message: string, path?: string, expected?: string, received?: string) => ValidationError;
/** Type guard for ParseError */
export declare const isParseError: (e: McpError) => e is ParseError;
/** Type guard for ConfigError */
export declare const isConfigError: (e: McpError) => e is ConfigError;
/** Type guard for SchemaError */
export declare const isSchemaError: (e: McpError) => e is SchemaError;
/** Type guard for OAuthError */
export declare const isOAuthError: (e: McpError) => e is OAuthError;
/** Type guard for TokenError */
export declare const isTokenError: (e: McpError) => e is TokenError;
/** Type guard for HttpError */
export declare const isHttpError: (e: McpError) => e is HttpError;
/** Type guard for ToolError */
export declare const isToolError: (e: McpError) => e is ToolError;
/** Type guard for ServerError */
export declare const isServerError: (e: McpError) => e is ServerError;
/** Type guard for ValidationError */
export declare const isValidationError: (e: McpError) => e is ValidationError;
/** Formats an error for display */
export declare const formatError: (error: McpError) => string;
export {};
//# sourceMappingURL=errors.d.ts.map