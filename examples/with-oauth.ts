/**
 * MCP Server with OAuth Authentication Example
 * 
 * This example demonstrates how to create an MCP server
 * with OAuth 2.1 authentication enabled.
 * 
 * Run with: npx tsx examples/with-oauth.ts
 */

import { createMcpServer, isOk, isErr, formatError } from 'contex';

async function main() {
  console.log('Creating MCP server with OAuth authentication...\n');
  
  const result = await createMcpServer({
    name: 'Secure Petstore MCP Server',
    version: '1.0.0',
    openApiSpec: './tests/fixtures/petstore.yaml',
    baseUrl: 'https://api.petstore.example.com/v1',
    
    auth: {
      type: 'oauth2',
      clientId: process.env.OAUTH_CLIENT_ID || 'demo-client-id',
      clientSecret: process.env.OAUTH_CLIENT_SECRET || 'demo-client-secret',
      authorizationUrl: 'https://auth.example.com/authorize',
      tokenUrl: 'https://auth.example.com/token',
      scopes: ['read:pets', 'write:pets'],
      pkce: true,
    },
    
    server: {
      port: 3001,
      transport: 'streamable-http',
      cors: {
        origin: ['http://localhost:3000', 'https://app.example.com'],
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id'],
      },
    },
    
    toolFilter: (operation) => {
      return !operation.deprecated;
    },
  });
  
  if (isErr(result)) {
    console.error('Failed to create server:', formatError(result.error));
    process.exit(1);
  }
  
  const server = result.value;
  
  console.log(`Server: ${server.name} v${server.version}`);
  console.log(`Tools: ${server.tools.length}`);
  console.log(`Resources: ${server.resources.length}`);
  
  console.log('\nOAuth Configuration:');
  console.log('  - PKCE: Enabled (S256)');
  console.log('  - Scopes: read:pets, write:pets');
  
  console.log('\nStarting server...');
  await server.start();
  
  console.log('\nSecure MCP server is running!');
  console.log('Connect using MCP client at http://localhost:3001/mcp');
  console.log('\nPress Ctrl+C to stop the server');
  
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down server...');
    await server.stop();
    console.log('Server stopped');
    process.exit(0);
  });
}

main().catch(console.error);
