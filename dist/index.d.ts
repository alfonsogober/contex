/**
 * MCP - Generic library for converting OpenAPI specifications into MCP servers.
 *
 * @example
 * ```typescript
 * import { createMcpServer } from 'mcp';
 *
 * const result = await createMcpServer({
 *   name: 'My API Server',
 *   version: '1.0.0',
 *   openApiSpec: './openapi.yaml',
 *   baseUrl: 'https://api.example.com',
 * });
 *
 * if (result._tag === 'Ok') {
 *   await result.value.start();
 * }
 * ```
 *
 * @packageDocumentation
 */
export type { HttpMethod, TransportType, JsonSchema, OpenApiParameter, OpenApiRequestBody, OpenApiResponse, Operation, OpenApiSpec, McpTool, McpResource, OAuthConfig, ApiKeyConfig, BearerConfig, AuthConfig, ServerConfig, McpServerConfig, TokenSet, PkceParams, HttpRequestConfig, HttpResponse, SchemaMeta, } from './core/types.js';
export { type Result, type Ok, type Err, ok, err, isOk, isErr, map, flatMap, mapErr, getOrElse, getOrElseW, fold, tryCatch, tryCatchAsync, sequence, traverse, fromNullable, } from './core/result.js';
export { type McpError, type ParseError, type ConfigError, type SchemaError, type OAuthError, type TokenError, type HttpError, type ToolError, type ServerError, type ValidationError, parseError, configError, schemaError, oauthError, tokenError, httpError, toolError, serverError, validationError, formatError, isParseError, isConfigError, isSchemaError, isOAuthError, isTokenError, isHttpError, isToolError, isServerError, isValidationError, } from './core/errors.js';
export { createMcpServer, createCustomMcpServer, validateConfig, type McpServer, } from './server/createServer.js';
export { parseOpenApiSpec, validateOpenApiVersion, extractOperations, filterByTag, filterNonDeprecated, groupByTag, getOperationId, getParameterNames, getPathParameters, getQueryParameters, getHeaderParameters, getRequestBodySchema, getSuccessResponseSchema, extractSchemas, extractSecuritySchemes, getBaseUrl, requiresAuth, parseAndExtractOperations, } from './openapi/parser.js';
export { jsonSchemaToZod, jsonSchemaToZodWithMeta, jsonSchemaTypeToZod, buildInputSchema, validateInput, applyNullable, applyDescription, applyDefault, } from './openapi/schemaConverter.js';
export { operationToTool, operationsToTools, buildToolDescription, buildToolInputSchema, filterToolableOperations, groupToolsByTag, createToolName, resolveToolNameConflicts, buildToolsPipeline, extractParameterValues, buildRequestUrl, } from './openapi/toolGenerator.js';
export { schemaToResource, schemasToResources, operationToResource, operationsToResources, extractAllResources, filterResources, filterByUriPrefix, groupByScheme, createResourceTemplate, hasUniqueUris, resolveUriConflicts, buildResourcesPipeline, schemaNameToUri, operationToUri, determineMimeType, isResourceableOperation, } from './openapi/resourceGenerator.js';
export { generateCodeVerifier, computeCodeChallenge, generatePkceParams, validateCodeVerifier, isValidCodeVerifier, isValidCodeChallenge, pkceToQueryParams, pkceToTokenParams, generateState, generateNonce, base64UrlEncode, } from './auth/pkce.js';
export { buildAuthorizationUrl, createAuthorizationState, validateState, isStateExpired, buildTokenRequestBody, buildClientCredentialsBody, buildRefreshTokenBody, parseTokenResponse, isTokenExpired, canRefreshToken, createAuthHeader, getTokenScopes, hasScope, validateOAuthConfig, initializeAuthFlow, type AuthorizationState, } from './auth/oauth.js';
export { createMemoryStorage, createTokenManagerState, getToken, setToken, deleteToken, refreshTokenRequest, getValidToken, getAuthHeader, getTimeUntilExpiry, withNewExpiry, mergeTokens, validateToken, type TokenStorage, type TokenManagerState, } from './auth/tokenManager.js';
export { extractBearerToken, extractToken, createSimpleValidator, createAuthMiddleware, requireScopes, optionalAuth, createApiKeyMiddleware, createFlexibleAuthMiddleware, authErrorHandler, createOAuthCorsHeaders, type AuthenticatedRequest, type TokenValidator, } from './auth/middleware.js';
export { createHttpClient, buildRequestHeaders, mergeUrls, withRetry, isSuccessStatus, isRetryableError, buildToolRequest, type HttpClient, type HttpClientConfig, } from './http/client.js';
export { createToolHandler, executeTool, createResourceHandler, formatToolList, formatResourceList, buildCapabilities, buildServerInfo, validateToolArgs, findTool, findResource, createErrorResponse, McpErrorCodes, type ToolContext, type ToolExecutionResult, } from './server/handlers.js';
export { isDefined, isString, isNumber, isBoolean, isObject, isArray, isFunction, getPath, setPath, compact, indexBy, groupBy, mapValues, filterEntries, deepMerge, memoizeLast, safeJsonParse, delay, omitKeys, pickKeys, toCamelCase, toSnakeCase, truncate, } from './utils/fp.js';
//# sourceMappingURL=index.d.ts.map