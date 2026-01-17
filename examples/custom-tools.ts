/**
 * MCP Server with Custom Tools Example
 * 
 * This example demonstrates how to create an MCP server
 * with custom tool definitions alongside OpenAPI-generated tools.
 * 
 * Run with: npx tsx examples/custom-tools.ts
 */

import { z } from 'zod';
import {
  createMcpServer,
  createCustomMcpServer,
  isOk,
  isErr,
  formatError,
  type McpTool,
  type McpResource,
  type Operation,
} from '../src/index.js';

const customTools: McpTool[] = [
  {
    name: 'calculatePetAge',
    description: 'Calculate a pet\'s age in human years based on species',
    inputSchema: z.object({
      species: z.enum(['dog', 'cat', 'bird', 'fish']),
      age: z.number().min(0).describe('Age in pet years'),
    }),
    operation: {
      method: 'get',
      path: '/custom/calculate-age',
      operationId: 'calculatePetAge',
    } as Operation,
    baseUrl: 'https://api.petstore.example.com/v1',
  },
  {
    name: 'generatePetName',
    description: 'Generate a random pet name based on species and characteristics',
    inputSchema: z.object({
      species: z.enum(['dog', 'cat', 'bird', 'fish']),
      personality: z.enum(['playful', 'calm', 'energetic', 'shy']).optional(),
    }),
    operation: {
      method: 'get',
      path: '/custom/generate-name',
      operationId: 'generatePetName',
    } as Operation,
    baseUrl: 'https://api.petstore.example.com/v1',
  },
];

const customResources: McpResource[] = [
  {
    uri: 'info://pet-care-guide',
    name: 'Pet Care Guide',
    description: 'General guidelines for pet care across different species',
    mimeType: 'text/markdown',
  },
  {
    uri: 'info://adoption-process',
    name: 'Adoption Process',
    description: 'Step-by-step guide to adopting a pet from our store',
    mimeType: 'text/markdown',
  },
];

async function main() {
  console.log('Creating MCP server with custom tools...\n');
  
  const result = await createCustomMcpServer(
    'Extended Petstore MCP Server',
    '1.0.0',
    customTools,
    customResources,
    {
      port: 3002,
      transport: 'streamable-http',
    }
  );
  
  if (isErr(result)) {
    console.error('Failed to create server:', formatError(result.error));
    process.exit(1);
  }
  
  const server = result.value;
  
  console.log(`Server: ${server.name} v${server.version}`);
  console.log(`Tools: ${server.tools.length}`);
  console.log(`Resources: ${server.resources.length}`);
  
  console.log('\nCustom tools:');
  for (const tool of server.tools) {
    console.log(`  - ${tool.name}: ${tool.description}`);
  }
  
  console.log('\nCustom resources:');
  for (const resource of server.resources) {
    console.log(`  - ${resource.uri}: ${resource.name}`);
  }
  
  console.log('\nStarting server...');
  await server.start();
  
  console.log('\nCustom MCP server is running!');
  console.log('Connect using MCP client at http://localhost:3002/mcp');
  console.log('\nPress Ctrl+C to stop the server');
  
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down server...');
    await server.stop();
    console.log('Server stopped');
    process.exit(0);
  });
}

main().catch(console.error);
