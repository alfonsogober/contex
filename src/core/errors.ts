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
export type McpError =
  | ParseError
  | ConfigError
  | SchemaError
  | OAuthError
  | TokenError
  | HttpError
  | ToolError
  | ServerError
  | ValidationError;

/** Creates a ParseError */
export const parseError = (
  message: string,
  source?: string,
  details?: unknown
): ParseError => ({
  _tag: 'ParseError',
  message,
  source,
  details,
});

/** Creates a ConfigError */
export const configError = (message: string, field?: string): ConfigError => ({
  _tag: 'ConfigError',
  message,
  field,
});

/** Creates a SchemaError */
export const schemaError = (
  message: string,
  schemaPath?: string,
  schemaType?: string
): SchemaError => ({
  _tag: 'SchemaError',
  message,
  schemaPath,
  schemaType,
});

/** Creates an OAuthError */
export const oauthError = (
  message: string,
  code?: string,
  statusCode?: number
): OAuthError => ({
  _tag: 'OAuthError',
  message,
  code,
  statusCode,
});

/** Creates a TokenError */
export const tokenError = (message: string, tokenType?: string): TokenError => ({
  _tag: 'TokenError',
  message,
  tokenType,
});

/** Creates an HttpError */
export const httpError = (
  message: string,
  statusCode: number,
  url?: string,
  method?: string
): HttpError => ({
  _tag: 'HttpError',
  message,
  statusCode,
  url,
  method,
});

/** Creates a ToolError */
export const toolError = (
  message: string,
  toolName: string,
  cause?: unknown
): ToolError => ({
  _tag: 'ToolError',
  message,
  toolName,
  cause,
});

/** Creates a ServerError */
export const serverError = (message: string, code?: string): ServerError => ({
  _tag: 'ServerError',
  message,
  code,
});

/** Creates a ValidationError */
export const validationError = (
  message: string,
  path?: string,
  expected?: string,
  received?: string
): ValidationError => ({
  _tag: 'ValidationError',
  message,
  path,
  expected,
  received,
});

/** Type guard for ParseError */
export const isParseError = (e: McpError): e is ParseError => e._tag === 'ParseError';

/** Type guard for ConfigError */
export const isConfigError = (e: McpError): e is ConfigError => e._tag === 'ConfigError';

/** Type guard for SchemaError */
export const isSchemaError = (e: McpError): e is SchemaError => e._tag === 'SchemaError';

/** Type guard for OAuthError */
export const isOAuthError = (e: McpError): e is OAuthError => e._tag === 'OAuthError';

/** Type guard for TokenError */
export const isTokenError = (e: McpError): e is TokenError => e._tag === 'TokenError';

/** Type guard for HttpError */
export const isHttpError = (e: McpError): e is HttpError => e._tag === 'HttpError';

/** Type guard for ToolError */
export const isToolError = (e: McpError): e is ToolError => e._tag === 'ToolError';

/** Type guard for ServerError */
export const isServerError = (e: McpError): e is ServerError => e._tag === 'ServerError';

/** Type guard for ValidationError */
export const isValidationError = (e: McpError): e is ValidationError =>
  e._tag === 'ValidationError';

/** Formats an error for display */
export const formatError = (error: McpError): string => {
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
