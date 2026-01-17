# MCP Library Architecture

## Overview

The MCP library is built using a **purely functional architecture** with Ramda. This document explains the design principles, data flow, and how to extend the library.

## Design Principles

### 1. Pure Functions

All business logic is implemented as pure functions - functions that:
- Always return the same output for the same input
- Have no side effects (no I/O, no mutation)
- Don't depend on external state

```typescript
// Pure function example
const operationToTool = (baseUrl: string) => (operation: Operation): McpTool => ({
  name: getOperationId(operation),
  description: buildToolDescription(operation),
  inputSchema: buildToolInputSchema(operation),
  operation,
  baseUrl,
});
```

### 2. Composition via R.pipe

Complex operations are built by composing simple functions using `R.pipe`:

```typescript
import * as R from 'ramda';

const buildToolsPipeline = (baseUrl: string) =>
  R.pipe(
    filterToolableOperations,      // Operation[] -> Operation[]
    operationsToTools(baseUrl),    // Operation[] -> McpTool[]
    resolveToolNameConflicts       // McpTool[] -> McpTool[]
  );
```

### 3. Immutable Data

All transformations return new objects instead of mutating existing ones:

```typescript
// Returns new object, doesn't mutate
const withNewExpiry = (token: TokenSet, expiresInSeconds: number): TokenSet => ({
  ...token,
  expiresAt: Date.now() + expiresInSeconds * 1000,
});
```

### 4. Effects at Boundaries

Side effects (HTTP requests, file I/O, server operations) are isolated at the edges of the system:

```
┌─────────────────────────────────────────────────────────────┐
│                      Pure Core                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Parser    │  │  Generator  │  │  Schema Converter   │  │
│  │  (pure)     │──│  (pure)     │──│  (pure)             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Effectful Boundary                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ HTTP Client │  │   Server    │  │    File I/O         │  │
│  │ (effects)   │  │  (effects)  │  │    (effects)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 5. Result Type for Errors

Instead of throwing exceptions, we use a `Result<T, E>` type:

```typescript
type Result<T, E> = Ok<T> | Err<E>;

// Usage
const result = await parseOpenApiSpec(spec);

if (isOk(result)) {
  const spec = result.value;
  // ...
} else {
  console.error(formatError(result.error));
}
```

## Module Structure

```
src/
├── core/           # Foundation types and utilities
│   ├── types.ts    # All TypeScript type definitions
│   ├── result.ts   # Result monad implementation
│   └── errors.ts   # Error types and constructors
│
├── openapi/        # OpenAPI processing (pure)
│   ├── parser.ts           # Parse OpenAPI specs
│   ├── schemaConverter.ts  # JSON Schema → Zod
│   ├── toolGenerator.ts    # Operations → MCP Tools
│   └── resourceGenerator.ts # Schemas → MCP Resources
│
├── auth/           # Authentication (mostly pure)
│   ├── pkce.ts         # PKCE utilities (pure except crypto)
│   ├── oauth.ts        # OAuth flow logic (pure)
│   ├── tokenManager.ts # Token operations (some effects)
│   └── middleware.ts   # Express middleware (effects)
│
├── http/           # HTTP operations (effectful boundary)
│   └── client.ts   # Axios-based HTTP client
│
├── server/         # Server implementation (effectful boundary)
│   ├── createServer.ts     # Main server factory
│   ├── handlers.ts         # Request handlers
│   └── transports/
│       ├── streamableHttp.ts
│       └── stdio.ts
│
└── utils/          # Shared utilities (pure)
    └── fp.ts       # Functional programming helpers
```

## Data Flow

### OpenAPI to MCP Server

```
OpenAPI Spec (YAML/JSON)
         │
         ▼
┌─────────────────┐
│  parseOpenApiSpec │ ───────▶ Result<OpenApiSpec, ParseError>
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ extractOperations │ ───────▶ Operation[]
└─────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌──────────┐
│ Tools │ │ Resources │
└───────┘ └──────────┘
    │         │
    ▼         ▼
┌─────────────────────┐
│    MCP Server       │
│  (Express + HTTP)   │
└─────────────────────┘
```

### Tool Execution Flow

```
MCP Client Request
         │
         ▼
┌─────────────────────┐
│  Validate Input     │ (jsonSchemaToZod)
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Extract Parameters  │ (extractParameterValues)
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   Build URL         │ (buildRequestUrl)
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  HTTP Request       │ (httpClient.request)
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Format Response    │
└─────────────────────┘
         │
         ▼
MCP Client Response
```

## Extending the Library

### Adding Custom Tools

```typescript
import { createCustomMcpServer, type McpTool } from 'mcp';
import { z } from 'zod';

const customTool: McpTool = {
  name: 'myCustomTool',
  description: 'Does something custom',
  inputSchema: z.object({
    param1: z.string(),
    param2: z.number().optional(),
  }),
  operation: {
    method: 'post',
    path: '/custom/endpoint',
    operationId: 'myCustomTool',
  },
  baseUrl: 'https://api.example.com',
};

const server = await createCustomMcpServer(
  'My Server',
  '1.0.0',
  [customTool],
  []
);
```

### Custom Schema Conversion

```typescript
import { jsonSchemaToZod, applyDescription } from 'mcp';

const customConverter = (schema: JsonSchema): ZodTypeAny => {
  const base = jsonSchemaToZod(schema);
  
  // Add custom validation
  if (schema.format === 'phone') {
    return z.string().regex(/^\+?[\d\s-]+$/);
  }
  
  return base;
};
```

### Custom Token Storage

```typescript
import { type TokenStorage, createTokenManagerState } from 'mcp';

const redisStorage: TokenStorage = {
  get: async (key) => {
    const data = await redis.get(`token:${key}`);
    return data ? JSON.parse(data) : undefined;
  },
  set: async (key, token) => {
    await redis.set(`token:${key}`, JSON.stringify(token));
  },
  delete: async (key) => {
    await redis.del(`token:${key}`);
  },
};

const tokenManager = createTokenManagerState(oauthConfig, redisStorage);
```

## Testing Strategy

### Unit Testing Pure Functions

Pure functions are trivial to test - no mocking required:

```typescript
describe('operationToTool', () => {
  it('creates tool with correct name', () => {
    const operation: Operation = {
      operationId: 'getUsers',
      method: 'get',
      path: '/users',
    };
    
    const tool = operationToTool('https://api.example.com')(operation);
    
    expect(tool.name).toBe('getUsers');
  });
});
```

### Testing Composed Pipelines

Test entire pipelines with realistic input:

```typescript
describe('buildToolsPipeline', () => {
  it('transforms operations to tools', () => {
    const operations: Operation[] = [
      { operationId: 'getUsers', method: 'get', path: '/users' },
      { operationId: 'createUser', method: 'post', path: '/users' },
    ];
    
    const tools = buildToolsPipeline('https://api.example.com')(operations);
    
    expect(tools).toHaveLength(2);
    expect(tools[0].name).toBe('getUsers');
    expect(tools[1].name).toBe('createUser');
  });
});
```

### Integration Testing

For effectful code, use integration tests with real (or mocked) services:

```typescript
describe('MCP Server Integration', () => {
  it('creates server from OpenAPI spec', async () => {
    const result = await createMcpServer({
      name: 'Test Server',
      version: '1.0.0',
      openApiSpec: './fixtures/petstore.yaml',
      baseUrl: 'https://api.example.com',
    });
    
    expect(isOk(result)).toBe(true);
  });
});
```

## Performance Considerations

1. **Lazy Evaluation**: Use Ramda's lazy evaluation where possible
2. **Memoization**: Use `memoizeLast` for expensive computations
3. **Parallel Processing**: HTTP requests can be parallelized
4. **Schema Caching**: Zod schemas are cached after creation
