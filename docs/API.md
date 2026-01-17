# MCP Library API Reference

## Table of Contents

- [Main API](#main-api)
- [Result Type](#result-type)
- [Error Types](#error-types)
- [OpenAPI Parsing](#openapi-parsing)
- [Schema Conversion](#schema-conversion)
- [Tool Generation](#tool-generation)
- [Resource Generation](#resource-generation)
- [Authentication](#authentication)
- [HTTP Client](#http-client)
- [Utilities](#utilities)

---

## Main API

### `createMcpServer(config: McpServerConfig): Promise<Result<McpServer, McpError>>`

Creates an MCP server from an OpenAPI specification.

```typescript
import { createMcpServer, isOk } from 'mcp';

const result = await createMcpServer({
  name: 'My API Server',
  version: '1.0.0',
  openApiSpec: './openapi.yaml',
  baseUrl: 'https://api.example.com',
  auth: {
    type: 'oauth2',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    authorizationUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/token',
    scopes: ['read', 'write'],
  },
  server: {
    port: 3000,
    transport: 'streamable-http',
  },
});

if (isOk(result)) {
  await result.value.start();
}
```

### `McpServerConfig`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Server name |
| `version` | `string` | Yes | Server version |
| `openApiSpec` | `string \| OpenApiSpec` | Yes | Path, URL, or parsed spec |
| `baseUrl` | `string` | Yes | Base URL for API calls |
| `auth` | `AuthConfig` | No | Authentication configuration |
| `server` | `Partial<ServerConfig>` | No | Server configuration |
| `toolFilter` | `(op: Operation) => boolean` | No | Filter operations for tools |
| `resourceFilter` | `(schema, name) => boolean` | No | Filter schemas for resources |

### `McpServer`

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Server name |
| `version` | `string` | Server version |
| `tools` | `McpTool[]` | Generated tools |
| `resources` | `McpResource[]` | Generated resources |
| `start()` | `() => Promise<void>` | Start the server |
| `stop()` | `() => Promise<void>` | Stop the server |
| `getApp()` | `() => Express \| undefined` | Get Express app |

---

## Result Type

The library uses a `Result<T, E>` type for error handling instead of exceptions.

### Types

```typescript
type Result<T, E> = Ok<T> | Err<E>;

interface Ok<T> { readonly _tag: 'Ok'; readonly value: T }
interface Err<E> { readonly _tag: 'Err'; readonly error: E }
```

### Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `ok` | `<T>(value: T) => Ok<T>` | Create success result |
| `err` | `<E>(error: E) => Err<E>` | Create error result |
| `isOk` | `<T, E>(r: Result<T, E>) => r is Ok<T>` | Type guard for Ok |
| `isErr` | `<T, E>(r: Result<T, E>) => r is Err<E>` | Type guard for Err |
| `map` | `<T, U, E>(fn: (t: T) => U) => (r: Result<T, E>) => Result<U, E>` | Map over Ok value |
| `flatMap` | `<T, U, E>(fn: (t: T) => Result<U, E>) => (r: Result<T, E>) => Result<U, E>` | Chain Results |
| `mapErr` | `<T, E, F>(fn: (e: E) => F) => (r: Result<T, E>) => Result<T, F>` | Map over Err value |
| `getOrElse` | `<T, E>(default: T) => (r: Result<T, E>) => T` | Extract value or default |
| `fold` | `<T, E, U>(onErr, onOk) => (r: Result<T, E>) => U` | Fold to single value |
| `tryCatch` | `<T, E>(fn, onError) => Result<T, E>` | Wrap throwing function |
| `sequence` | `<T, E>(rs: Result<T, E>[]) => Result<T[], E>` | Combine Results |

---

## Error Types

### Error Constructors

```typescript
parseError(message: string, source?: string, details?: unknown): ParseError
configError(message: string, field?: string): ConfigError
schemaError(message: string, path?: string, type?: string): SchemaError
oauthError(message: string, code?: string, status?: number): OAuthError
tokenError(message: string, tokenType?: string): TokenError
httpError(message: string, status: number, url?: string, method?: string): HttpError
toolError(message: string, toolName: string, cause?: unknown): ToolError
serverError(message: string, code?: string): ServerError
validationError(message: string, path?: string, expected?: string, received?: string): ValidationError
```

### Type Guards

```typescript
isParseError(e: McpError): e is ParseError
isConfigError(e: McpError): e is ConfigError
isSchemaError(e: McpError): e is SchemaError
isOAuthError(e: McpError): e is OAuthError
isTokenError(e: McpError): e is TokenError
isHttpError(e: McpError): e is HttpError
isToolError(e: McpError): e is ToolError
isServerError(e: McpError): e is ServerError
isValidationError(e: McpError): e is ValidationError
```

### `formatError(error: McpError): string`

Formats any error type for display.

---

## OpenAPI Parsing

### `parseOpenApiSpec(spec: string | object): Promise<Result<OpenApiSpec, ParseError>>`

Parses an OpenAPI specification from a file path, URL, or object.

### `extractOperations(spec: OpenApiSpec): Operation[]`

Extracts all operations from an OpenAPI specification.

### `filterByTag(tag: string): (ops: Operation[]) => Operation[]`

Filters operations by tag.

### `filterNonDeprecated(ops: Operation[]): Operation[]`

Filters out deprecated operations.

### `getOperationId(op: Operation): string`

Gets or generates an operation ID.

### `requiresAuth(op: Operation, spec: OpenApiSpec): boolean`

Checks if an operation requires authentication.

---

## Schema Conversion

### `jsonSchemaToZod(schema: JsonSchema): ZodTypeAny`

Converts a JSON Schema to a Zod schema.

### `buildInputSchema(params, requestBody?): ZodTypeAny`

Builds a combined input schema from parameters and request body.

### `validateInput<T>(schema: ZodSchema<T>, input: unknown)`

Validates input against a Zod schema.

---

## Tool Generation

### `operationToTool(baseUrl: string): (op: Operation) => McpTool`

Converts a single operation to an MCP tool.

### `buildToolsPipeline(baseUrl: string): (ops: Operation[]) => McpTool[]`

Complete pipeline for building tools from operations.

### `buildRequestUrl(baseUrl, path, pathParams, queryParams): string`

Builds the full URL for a tool execution.

---

## Resource Generation

### `schemasToResources(spec: OpenApiSpec): McpResource[]`

Converts all schemas to MCP resources.

### `buildResourcesPipeline(spec: OpenApiSpec): McpResource[]`

Complete pipeline for building resources.

---

## Authentication

### PKCE

```typescript
generateCodeVerifier(): string
computeCodeChallenge(verifier: string): string
generatePkceParams(): PkceParams
validateCodeVerifier(verifier: string, challenge: string): boolean
```

### OAuth

```typescript
buildAuthorizationUrl(config: OAuthConfig, state: AuthorizationState): string
createAuthorizationState(redirectUri: string): AuthorizationState
parseTokenResponse(response: unknown): Result<TokenSet, OAuthError>
isTokenExpired(token: TokenSet, bufferMs?: number): boolean
canRefreshToken(token: TokenSet): boolean
createAuthHeader(token: TokenSet): string
```

### Token Management

```typescript
createMemoryStorage(): TokenStorage
createTokenManagerState(config, storage?, fetch?): TokenManagerState
getValidToken(state, key): Promise<Result<TokenSet, TokenError>>
getAuthHeader(state, key): Promise<Result<string, TokenError>>
```

### Middleware

```typescript
createAuthMiddleware(validator: TokenValidator): RequestHandler
requireScopes(...scopes: string[]): RequestHandler
optionalAuth(validator: TokenValidator): RequestHandler
createApiKeyMiddleware(validKeys: Set<string>, headerName?: string): RequestHandler
```

---

## HTTP Client

### `createHttpClient(config?: HttpClientConfig): HttpClient`

Creates an HTTP client instance.

```typescript
interface HttpClient {
  request<T>(config: HttpRequestConfig): Promise<Result<HttpResponse<T>, HttpError>>
  get<T>(url: string, params?: Record<string, unknown>): Promise<Result<HttpResponse<T>, HttpError>>
  post<T>(url: string, data?: unknown): Promise<Result<HttpResponse<T>, HttpError>>
  put<T>(url: string, data?: unknown): Promise<Result<HttpResponse<T>, HttpError>>
  patch<T>(url: string, data?: unknown): Promise<Result<HttpResponse<T>, HttpError>>
  delete<T>(url: string): Promise<Result<HttpResponse<T>, HttpError>>
  setAuthToken(token: TokenSet): void
  clearAuthToken(): void
}
```

### `withRetry<T, E>(fn, maxRetries?, baseDelayMs?): Promise<Result<T, E>>`

Retries a request with exponential backoff.

---

## Utilities

### Type Guards

```typescript
isDefined<T>(value: T | null | undefined): value is T
isString(value: unknown): value is string
isNumber(value: unknown): value is number
isBoolean(value: unknown): value is boolean
isObject(value: unknown): value is Record<string, unknown>
isArray<T>(value: unknown): value is T[]
```

### Object Utilities

```typescript
getPath<T>(path: string[]): (obj: unknown) => T | undefined
setPath<T>(path: string[], value: unknown): (obj: T) => T
deepMerge<T>(source: T, target: Partial<T>): T
omitKeys<T, K>(keys: K[]): (obj: T) => Omit<T, K>
pickKeys<T, K>(keys: K[]): (obj: T) => Pick<T, K>
```

### String Utilities

```typescript
toCamelCase(str: string): string
toSnakeCase(str: string): string
truncate(maxLength: number, suffix?: string): (str: string) => string
```

### Async Utilities

```typescript
delay(ms: number): Promise<void>
memoizeLast<T, R>(fn: (arg: T) => R): (arg: T) => R
safeJsonParse<T>(json: string): T | undefined
```
