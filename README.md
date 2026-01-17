# Contex - OpenAPI to Model Context Protocol Server

A generic TypeScript library for converting OpenAPI specifications into MCP (Model Context Protocol) servers. Built with a purely functional architecture using Ramda.

## Features

- **Generic OpenAPI Conversion**: Convert any OpenAPI 3.x specification into a fully functional MCP server
- **OAuth 2.1 Support**: Built-in authentication with PKCE support
- **Purely Functional**: Composable pure functions using Ramda and `R.pipe()`
- **Type-Safe**: Full TypeScript support with Result monad for error handling
- **Extensible**: Easy to add custom tools and resources
- **Well-Tested**: 100% unit test coverage target

## Installation

```bash
npm install contex zod
```

## Quick Start

```typescript
import { createMcpServer, isOk } from 'contex';

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

## With OAuth Authentication

```typescript
import { createMcpServer, isOk } from 'contex';

const result = await createMcpServer({
  name: 'Secure API Server',
  version: '1.0.0',
  openApiSpec: './openapi.yaml',
  baseUrl: 'https://api.example.com',
  auth: {
    type: 'oauth2',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    authorizationUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/token',
    scopes: ['read', 'write'],
    pkce: true, // Enabled by default
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

## API Overview

### Main Functions

- `createMcpServer(config)` - Create MCP server from OpenAPI spec
- `createCustomMcpServer(name, version, tools, resources)` - Create server with custom tools

### Result Type

The library uses a `Result<T, E>` monad for error handling:

```typescript
import { isOk, isErr, fold, formatError } from 'contex';

const result = await createMcpServer(config);

// Pattern matching with type guards
if (isOk(result)) {
  const server = result.value;
} else {
  console.error(formatError(result.error));
}

// Or use fold
const server = fold(
  (error) => { console.error(error); return null; },
  (server) => server
)(result);
```

### Tool and Resource Generation

```typescript
import {
  parseOpenApiSpec,
  extractOperations,
  buildToolsPipeline,
  buildResourcesPipeline,
} from 'contex';

// Parse OpenAPI spec
const specResult = await parseOpenApiSpec('./openapi.yaml');

if (isOk(specResult)) {
  const spec = specResult.value;
  
  // Extract operations
  const operations = extractOperations(spec);
  
  // Build tools
  const tools = buildToolsPipeline('https://api.example.com')(operations);
  
  // Build resources
  const resources = buildResourcesPipeline(spec);
}
```

## Architecture

The library follows a purely functional architecture:

1. **Pure Functions**: All business logic is implemented as pure functions
2. **Composition via `R.pipe`**: Complex operations built from simple functions
3. **Immutable Data**: All transformations return new objects
4. **Effects at Boundaries**: Side effects isolated to server/HTTP edges
5. **Result Type**: Error handling via `Result<T, E>` (no throwing)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## Documentation

- [API Reference](docs/API.md) - Complete API documentation
- [Architecture Guide](docs/ARCHITECTURE.md) - Design principles and patterns
- [Examples](docs/EXAMPLES.md) - Usage examples and patterns

## Examples

See the `examples/` directory for complete examples:

- `basic-server.ts` - Basic MCP server from OpenAPI
- `with-oauth.ts` - Server with OAuth authentication
- `custom-tools.ts` - Server with custom tool definitions

## Existing Alternatives

Several similar libraries exist in the ecosystem:

| Library | Description |
|---------|-------------|
| [openapi-mcpserver-generator](https://www.npmjs.com/package/openapi-mcpserver-generator) | Generates MCP server code from OpenAPI specs |
| [openapi-mcp-generator](https://github.com/harsha-iiiv/openapi-mcp-generator) | TypeScript tool for OpenAPI → MCP conversion |
| [openapi-to-mcp-converter](https://github.com/zxypro1/openapi-to-mcp-converter) | Automatic OpenAPI to MCP Server conversion |
| [openapi-mcp-server](https://github.com/sotayamashita/openapi-mcp-server) | Bridge between OpenAPI and MCP for Claude Desktop |
| [api-to-mcp](https://github.com/TykTechnologies/api-to-mcp) | Turn any API into MCP tools |
| [Stainless](https://www.stainless.com/blog/generate-mcp-servers-from-openapi-specs) | Commercial platform for MCP server generation |
| [Speakeasy](https://www.speakeasy.com/docs/standalone-mcp/build-server) | Commercial tool for generating MCP servers |

### How This Library Differs

| Feature | Existing Tools | This Library |
|---------|---------------|--------------|
| Architecture | Mostly imperative/OOP | Purely functional (Ramda) |
| Error Handling | Exceptions | Result monad |
| OAuth Support | Limited/varies | Full OAuth 2.1 + PKCE |
| Runtime | Code generation | Runtime conversion |
| Composability | Low | High (`R.pipe`) |

**Unique aspects of this library:**
- Purely functional architecture using Ramda
- Result monad for type-safe error handling (no exceptions)
- Runtime library (not code generation)
- Built-in OAuth 2.1 with PKCE support
- Highly composable pure functions

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build
```

## License

MIT
