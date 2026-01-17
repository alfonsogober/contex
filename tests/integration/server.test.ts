import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMcpServer, type McpServer } from '../../src/server/createServer.js';
import { isOk, isErr } from '../../src/core/result.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('MCP Server Integration', () => {
  describe('createMcpServer', () => {
    it('creates server from OpenAPI spec file', async () => {
      const specPath = path.join(__dirname, '../fixtures/petstore.yaml');
      
      const result = await createMcpServer({
        name: 'Petstore Server',
        version: '1.0.0',
        openApiSpec: specPath,
        baseUrl: 'https://api.petstore.example.com/v1',
      });
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const server = result.value;
        expect(server.name).toBe('Petstore Server');
        expect(server.version).toBe('1.0.0');
        expect(server.tools.length).toBeGreaterThan(0);
        expect(server.resources.length).toBeGreaterThan(0);
      }
    });

    it('extracts tools from OpenAPI operations', async () => {
      const specPath = path.join(__dirname, '../fixtures/petstore.yaml');
      
      const result = await createMcpServer({
        name: 'Petstore Server',
        version: '1.0.0',
        openApiSpec: specPath,
        baseUrl: 'https://api.petstore.example.com/v1',
      });
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const server = result.value;
        const toolNames = server.tools.map((t) => t.name);
        
        expect(toolNames).toContain('listPets');
        expect(toolNames).toContain('createPet');
        expect(toolNames).toContain('getPet');
        expect(toolNames).toContain('updatePet');
        expect(toolNames).toContain('deletePet');
      }
    });

    it('applies tool filter', async () => {
      const specPath = path.join(__dirname, '../fixtures/petstore.yaml');
      
      const result = await createMcpServer({
        name: 'Petstore Server',
        version: '1.0.0',
        openApiSpec: specPath,
        baseUrl: 'https://api.petstore.example.com/v1',
        toolFilter: (op) => op.method === 'get',
      });
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const server = result.value;
        const methods = server.tools.map((t) => t.operation.method);
        expect(methods.every((m) => m === 'get')).toBe(true);
      }
    });

    it('returns error for invalid config', async () => {
      const result = await createMcpServer({
        name: '',
        version: '1.0.0',
        openApiSpec: './nonexistent.yaml',
        baseUrl: 'https://api.example.com',
      });
      
      expect(isErr(result)).toBe(true);
    });

    it('returns error for invalid base URL', async () => {
      const specPath = path.join(__dirname, '../fixtures/petstore.yaml');
      
      const result = await createMcpServer({
        name: 'Test Server',
        version: '1.0.0',
        openApiSpec: specPath,
        baseUrl: 'not-a-url',
      });
      
      expect(isErr(result)).toBe(true);
    });

    it('creates resources from schemas', async () => {
      const specPath = path.join(__dirname, '../fixtures/petstore.yaml');
      
      const result = await createMcpServer({
        name: 'Petstore Server',
        version: '1.0.0',
        openApiSpec: specPath,
        baseUrl: 'https://api.petstore.example.com/v1',
      });
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const server = result.value;
        const resourceNames = server.resources.map((r) => r.name);
        
        expect(resourceNames).toContain('Pet');
        expect(resourceNames).toContain('NewPet');
        expect(resourceNames).toContain('Photo');
      }
    });

    it('generates input schemas for tools', async () => {
      const specPath = path.join(__dirname, '../fixtures/petstore.yaml');
      
      const result = await createMcpServer({
        name: 'Petstore Server',
        version: '1.0.0',
        openApiSpec: specPath,
        baseUrl: 'https://api.petstore.example.com/v1',
      });
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const server = result.value;
        const getPetTool = server.tools.find((t) => t.name === 'getPet');
        
        expect(getPetTool).toBeDefined();
        expect(getPetTool!.inputSchema).toBeDefined();
        
        const validResult = getPetTool!.inputSchema.safeParse({ petId: '123' });
        expect(validResult.success).toBe(true);
        
        const invalidResult = getPetTool!.inputSchema.safeParse({});
        expect(invalidResult.success).toBe(false);
      }
    });
  });

  describe('Tool descriptions', () => {
    it('includes summary in description', async () => {
      const specPath = path.join(__dirname, '../fixtures/petstore.yaml');
      
      const result = await createMcpServer({
        name: 'Petstore Server',
        version: '1.0.0',
        openApiSpec: specPath,
        baseUrl: 'https://api.petstore.example.com/v1',
      });
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const server = result.value;
        const listPetsTool = server.tools.find((t) => t.name === 'listPets');
        
        expect(listPetsTool!.description).toContain('List all pets');
      }
    });

    it('includes HTTP method and path', async () => {
      const specPath = path.join(__dirname, '../fixtures/petstore.yaml');
      
      const result = await createMcpServer({
        name: 'Petstore Server',
        version: '1.0.0',
        openApiSpec: specPath,
        baseUrl: 'https://api.petstore.example.com/v1',
      });
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const server = result.value;
        const createPetTool = server.tools.find((t) => t.name === 'createPet');
        
        expect(createPetTool!.description).toContain('POST');
        expect(createPetTool!.description).toContain('/pets');
      }
    });
  });
});
