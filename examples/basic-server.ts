/**
 * Basic MCP Server Example
 * 
 * This example demonstrates how to create a simple MCP server
 * from an OpenAPI specification.
 * 
 * Run with: npx tsx examples/basic-server.ts
 */

import { createMcpServer, isOk, isErr, formatError } from 'contex';

async function main() {
  console.log('Creating MCP server from OpenAPI spec...\n');
  
  const result = await createMcpServer({
    name: 'Petstore MCP Server',
    version: '1.0.0',
    openApiSpec: './tests/fixtures/petstore.yaml',
    baseUrl: 'https://api.petstore.example.com/v1',
    server: {
      port: 3000,
      transport: 'streamable-http',
      cors: {
        origin: '*',
      },
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
  
  console.log('\nAvailable tools:');
  for (const tool of server.tools) {
    console.log(`  - ${tool.name}: ${tool.description.slice(0, 60)}...`);
  }
  
  console.log('\nAvailable resources:');
  for (const resource of server.resources) {
    console.log(`  - ${resource.uri}: ${resource.name}`);
  }
  
  console.log('\nStarting server...');
  await server.start();
  
  console.log('\nMCP server is running!');
  console.log('Connect using MCP client at http://localhost:3000/mcp');
  console.log('\nPress Ctrl+C to stop the server');
  
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down server...');
    await server.stop();
    console.log('Server stopped');
    process.exit(0);
  });
}

main().catch(console.error);
