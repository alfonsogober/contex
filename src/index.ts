/**
 * MCP - Generic library for converting OpenAPI specifications into MCP servers.
 * 
 * @example
 * ```typescript
 * import { createMcpServer } from 'contex';
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

// Core types
export type {
  HttpMethod,
  TransportType,
  JsonSchema,
  OpenApiParameter,
  OpenApiRequestBody,
  OpenApiResponse,
  Operation,
  OpenApiSpec,
  McpTool,
  McpResource,
  OAuthConfig,
  ApiKeyConfig,
  BearerConfig,
  AuthConfig,
  ServerConfig,
  McpServerConfig,
  TokenSet,
  PkceParams,
  HttpRequestConfig,
  HttpResponse,
  SchemaMeta,
} from './core/types.js';

// Result type and utilities
export {
  type Result,
  type Ok,
  type Err,
  ok,
  err,
  isOk,
  isErr,
  map,
  flatMap,
  mapErr,
  getOrElse,
  getOrElseW,
  fold,
  tryCatch,
  tryCatchAsync,
  sequence,
  traverse,
  fromNullable,
} from './core/result.js';

// Error types and constructors
export {
  type McpError,
  type ParseError,
  type ConfigError,
  type SchemaError,
  type OAuthError,
  type TokenError,
  type HttpError,
  type ToolError,
  type ServerError,
  type ValidationError,
  parseError,
  configError,
  schemaError,
  oauthError,
  tokenError,
  httpError,
  toolError,
  serverError,
  validationError,
  formatError,
  isParseError,
  isConfigError,
  isSchemaError,
  isOAuthError,
  isTokenError,
  isHttpError,
  isToolError,
  isServerError,
  isValidationError,
} from './core/errors.js';

// Server creation
export {
  createMcpServer,
  createCustomMcpServer,
  validateConfig,
  type McpServer,
} from './server/createServer.js';

// OpenAPI parsing
export {
  parseOpenApiSpec,
  validateOpenApiVersion,
  extractOperations,
  filterByTag,
  filterNonDeprecated,
  groupByTag,
  getOperationId,
  getParameterNames,
  getPathParameters,
  getQueryParameters,
  getHeaderParameters,
  getRequestBodySchema,
  getSuccessResponseSchema,
  extractSchemas,
  extractSecuritySchemes,
  getBaseUrl,
  requiresAuth,
  parseAndExtractOperations,
} from './openapi/parser.js';

// Schema conversion
export {
  jsonSchemaToZod,
  jsonSchemaToZodWithMeta,
  jsonSchemaTypeToZod,
  buildInputSchema,
  validateInput,
  applyNullable,
  applyDescription,
  applyDefault,
} from './openapi/schemaConverter.js';

// Tool generation
export {
  operationToTool,
  operationsToTools,
  buildToolDescription,
  buildToolInputSchema,
  filterToolableOperations,
  groupToolsByTag,
  createToolName,
  resolveToolNameConflicts,
  buildToolsPipeline,
  extractParameterValues,
  buildRequestUrl,
} from './openapi/toolGenerator.js';

// Resource generation
export {
  schemaToResource,
  schemasToResources,
  operationToResource,
  operationsToResources,
  extractAllResources,
  filterResources,
  filterByUriPrefix,
  groupByScheme,
  createResourceTemplate,
  hasUniqueUris,
  resolveUriConflicts,
  buildResourcesPipeline,
  schemaNameToUri,
  operationToUri,
  determineMimeType,
  isResourceableOperation,
} from './openapi/resourceGenerator.js';

// PKCE utilities
export {
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
} from './auth/pkce.js';

// OAuth utilities
export {
  buildAuthorizationUrl,
  createAuthorizationState,
  validateState,
  isStateExpired,
  buildTokenRequestBody,
  buildClientCredentialsBody,
  buildRefreshTokenBody,
  parseTokenResponse,
  isTokenExpired,
  canRefreshToken,
  createAuthHeader,
  getTokenScopes,
  hasScope,
  validateOAuthConfig,
  initializeAuthFlow,
  type AuthorizationState,
} from './auth/oauth.js';

// Token management
export {
  createMemoryStorage,
  createTokenManagerState,
  getToken,
  setToken,
  deleteToken,
  refreshTokenRequest,
  getValidToken,
  getAuthHeader,
  getTimeUntilExpiry,
  withNewExpiry,
  mergeTokens,
  validateToken,
  type TokenStorage,
  type TokenManagerState,
} from './auth/tokenManager.js';

// Auth middleware
export {
  extractBearerToken,
  extractToken,
  createSimpleValidator,
  createAuthMiddleware,
  requireScopes,
  optionalAuth,
  createApiKeyMiddleware,
  createFlexibleAuthMiddleware,
  authErrorHandler,
  createOAuthCorsHeaders,
  type AuthenticatedRequest,
  type TokenValidator,
} from './auth/middleware.js';

// HTTP client
export {
  createHttpClient,
  buildRequestHeaders,
  mergeUrls,
  withRetry,
  isSuccessStatus,
  isRetryableError,
  buildToolRequest,
  type HttpClient,
  type HttpClientConfig,
} from './http/client.js';

// Server handlers
export {
  createToolHandler,
  executeTool,
  createResourceHandler,
  formatToolList,
  formatResourceList,
  buildCapabilities,
  buildServerInfo,
  validateToolArgs,
  findTool,
  findResource,
  createErrorResponse,
  McpErrorCodes,
  type ToolContext,
  type ToolExecutionResult,
} from './server/handlers.js';

// FP utilities
export {
  isDefined,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isFunction,
  getPath,
  setPath,
  compact,
  indexBy,
  groupBy,
  mapValues,
  filterEntries,
  deepMerge,
  memoizeLast,
  safeJsonParse,
  delay,
  omitKeys,
  pickKeys,
  toCamelCase,
  toSnakeCase,
  truncate,
} from './utils/fp.js';
