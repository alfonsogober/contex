# MCP Library Examples

## Table of Contents

- [Basic Usage](#basic-usage)
- [With OAuth Authentication](#with-oauth-authentication)
- [Custom Tools](#custom-tools)
- [Filtering Operations](#filtering-operations)
- [Error Handling](#error-handling)
- [Token Management](#token-management)
- [Custom HTTP Client](#custom-http-client)

---

## Basic Usage

### Minimal Server Setup

```typescript
import { createMcpServer, isOk } from 'mcp';

const result = await createMcpServer({
  name: 'My API Server',
  version: '1.0.0',
  openApiSpec: './openapi.yaml',
  baseUrl: 'https://api.example.com',
});

if (isOk(result)) {
  await result.value.start();
  console.log('MCP server running on port 3000');
}
```

### From OpenAPI URL

```typescript
const result = await createMcpServer({
  name: 'GitHub API Server',
  version: '1.0.0',
  openApiSpec: 'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.yaml',
  baseUrl: 'https://api.github.com',
});
```

### From Inline Spec

```typescript
const spec = {
  openapi: '3.0.3',
  info: { title: 'My API', version: '1.0.0' },
  paths: {
    '/users': {
      get: {
        operationId: 'getUsers',
        summary: 'List users',
        responses: { '200': { description: 'Success' } },
      },
    },
  },
};

const result = await createMcpServer({
  name: 'Inline API Server',
  version: '1.0.0',
  openApiSpec: spec,
  baseUrl: 'https://api.example.com',
});
```

---

## With OAuth Authentication

### Authorization Code Flow with PKCE

```typescript
import { createMcpServer, isOk } from 'mcp';

const result = await createMcpServer({
  name: 'Secure API Server',
  version: '1.0.0',
  openApiSpec: './openapi.yaml',
  baseUrl: 'https://api.example.com',
  auth: {
    type: 'oauth2',
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    authorizationUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/token',
    scopes: ['read', 'write'],
    pkce: true, // Enabled by default
  },
});
```

### API Key Authentication

```typescript
const result = await createMcpServer({
  name: 'API Key Server',
  version: '1.0.0',
  openApiSpec: './openapi.yaml',
  baseUrl: 'https://api.example.com',
  auth: {
    type: 'apiKey',
    key: process.env.API_KEY!,
    headerName: 'X-API-Key',
  },
});
```

### Bearer Token Authentication

```typescript
const result = await createMcpServer({
  name: 'Bearer Token Server',
  version: '1.0.0',
  openApiSpec: './openapi.yaml',
  baseUrl: 'https://api.example.com',
  auth: {
    type: 'bearer',
    token: process.env.BEARER_TOKEN!,
  },
});
```

---

## Custom Tools

### Adding Custom Tools to OpenAPI-based Server

```typescript
import { createMcpServer, isOk, type McpTool } from 'mcp';
import { z } from 'zod';

// Create server from OpenAPI
const result = await createMcpServer({
  name: 'Extended API Server',
  version: '1.0.0',
  openApiSpec: './openapi.yaml',
  baseUrl: 'https://api.example.com',
});

if (isOk(result)) {
  const server = result.value;
  
  // Access generated tools
  console.log('Generated tools:', server.tools.map(t => t.name));
}
```

### Creating Server with Only Custom Tools

```typescript
import { createCustomMcpServer, isOk, type McpTool, type McpResource } from 'mcp';
import { z } from 'zod';

const tools: McpTool[] = [
  {
    name: 'searchProducts',
    description: 'Search for products by query',
    inputSchema: z.object({
      query: z.string().min(1),
      category: z.enum(['electronics', 'clothing', 'books']).optional(),
      maxPrice: z.number().positive().optional(),
    }),
    operation: {
      method: 'get',
      path: '/products/search',
      operationId: 'searchProducts',
    },
    baseUrl: 'https://api.shop.example.com',
  },
  {
    name: 'getProductDetails',
    description: 'Get detailed information about a product',
    inputSchema: z.object({
      productId: z.string().uuid(),
    }),
    operation: {
      method: 'get',
      path: '/products/{productId}',
      operationId: 'getProductDetails',
    },
    baseUrl: 'https://api.shop.example.com',
  },
];

const resources: McpResource[] = [
  {
    uri: 'catalog://categories',
    name: 'Product Categories',
    description: 'List of all product categories',
    mimeType: 'application/json',
  },
];

const result = await createCustomMcpServer(
  'Shop API Server',
  '1.0.0',
  tools,
  resources,
  { port: 3001 }
);

if (isOk(result)) {
  await result.value.start();
}
```

---

## Filtering Operations

### Include Only GET Operations

```typescript
const result = await createMcpServer({
  name: 'Read-Only Server',
  version: '1.0.0',
  openApiSpec: './openapi.yaml',
  baseUrl: 'https://api.example.com',
  toolFilter: (operation) => operation.method === 'get',
});
```

### Exclude Deprecated Operations

```typescript
const result = await createMcpServer({
  name: 'Modern Server',
  version: '1.0.0',
  openApiSpec: './openapi.yaml',
  baseUrl: 'https://api.example.com',
  toolFilter: (operation) => !operation.deprecated,
});
```

### Filter by Tags

```typescript
const result = await createMcpServer({
  name: 'Users API Server',
  version: '1.0.0',
  openApiSpec: './openapi.yaml',
  baseUrl: 'https://api.example.com',
  toolFilter: (operation) => operation.tags?.includes('users') ?? false,
});
```

### Complex Filtering

```typescript
const result = await createMcpServer({
  name: 'Filtered Server',
  version: '1.0.0',
  openApiSpec: './openapi.yaml',
  baseUrl: 'https://api.example.com',
  toolFilter: (operation) => {
    // Exclude admin endpoints
    if (operation.path.startsWith('/admin')) return false;
    
    // Only include operations with an operationId
    if (!operation.operationId) return false;
    
    // Exclude deprecated
    if (operation.deprecated) return false;
    
    return true;
  },
});
```

---

## Error Handling

### Using Result Type

```typescript
import {
  createMcpServer,
  isOk,
  isErr,
  formatError,
  isConfigError,
  isParseError,
} from 'mcp';

const result = await createMcpServer({
  name: 'My Server',
  version: '1.0.0',
  openApiSpec: './openapi.yaml',
  baseUrl: 'https://api.example.com',
});

if (isErr(result)) {
  const error = result.error;
  
  if (isConfigError(error)) {
    console.error(`Configuration error in field '${error.field}': ${error.message}`);
  } else if (isParseError(error)) {
    console.error(`Failed to parse spec from '${error.source}': ${error.message}`);
  } else {
    console.error(formatError(error));
  }
  
  process.exit(1);
}

const server = result.value;
await server.start();
```

### Using fold

```typescript
import { createMcpServer, fold, formatError } from 'mcp';

const server = await createMcpServer({
  name: 'My Server',
  version: '1.0.0',
  openApiSpec: './openapi.yaml',
  baseUrl: 'https://api.example.com',
}).then(
  fold(
    (error) => {
      console.error('Failed:', formatError(error));
      return null;
    },
    (server) => server
  )
);

if (server) {
  await server.start();
}
```

---

## Token Management

### Manual Token Management

```typescript
import {
  createTokenManagerState,
  createMemoryStorage,
  getValidToken,
  setToken,
  isOk,
} from 'mcp';

const tokenManager = createTokenManagerState({
  type: 'oauth2',
  clientId: 'my-client',
  clientSecret: 'my-secret',
  authorizationUrl: 'https://auth.example.com/authorize',
  tokenUrl: 'https://auth.example.com/token',
  scopes: ['read'],
});

// Store a token
await setToken(tokenManager, 'user-123', {
  accessToken: 'access-token',
  tokenType: 'Bearer',
  expiresAt: Date.now() + 3600000,
  refreshToken: 'refresh-token',
});

// Get a valid token (auto-refreshes if expired)
const result = await getValidToken(tokenManager, 'user-123');

if (isOk(result)) {
  console.log('Token:', result.value.accessToken);
}
```

### Custom Token Storage (Redis Example)

```typescript
import { createTokenManagerState, type TokenStorage } from 'mcp';
import Redis from 'ioredis';

const redis = new Redis();

const redisStorage: TokenStorage = {
  get: async (key) => {
    const data = await redis.get(`mcp:token:${key}`);
    return data ? JSON.parse(data) : undefined;
  },
  set: async (key, token) => {
    const ttl = token.expiresAt
      ? Math.ceil((token.expiresAt - Date.now()) / 1000)
      : 86400;
    await redis.set(`mcp:token:${key}`, JSON.stringify(token), 'EX', ttl);
  },
  delete: async (key) => {
    await redis.del(`mcp:token:${key}`);
  },
};

const tokenManager = createTokenManagerState(oauthConfig, redisStorage);
```

---

## Custom HTTP Client

### With Custom Headers

```typescript
import { createHttpClient, isOk } from 'mcp';

const client = createHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 30000,
  headers: {
    'X-Custom-Header': 'custom-value',
    'User-Agent': 'MyApp/1.0',
  },
});

const result = await client.get('/users');

if (isOk(result)) {
  console.log('Users:', result.value.data);
}
```

### With Retry Logic

```typescript
import { createHttpClient, withRetry, isRetryableError, isOk, isErr } from 'mcp';

const client = createHttpClient({
  baseUrl: 'https://api.example.com',
});

// Retry up to 3 times with exponential backoff
const result = await withRetry(
  () => client.get('/flaky-endpoint'),
  3,   // maxRetries
  1000 // baseDelayMs
);

if (isOk(result)) {
  console.log('Success:', result.value.data);
} else {
  console.error('Failed after retries:', result.error.message);
}
```

### With Authentication

```typescript
import { createHttpClient, type TokenSet } from 'mcp';

const client = createHttpClient({
  baseUrl: 'https://api.example.com',
});

// Set auth token
const token: TokenSet = {
  accessToken: 'my-access-token',
  tokenType: 'Bearer',
};

client.setAuthToken(token);

// All requests now include Authorization header
const result = await client.get('/protected-resource');

// Clear when done
client.clearAuthToken();
```
