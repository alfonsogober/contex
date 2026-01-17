import { describe, it, expect } from 'vitest';
import {
  operationToTool,
  operationsToTools,
  buildToolDescription,
  buildToolInputSchema,
  filterToolableOperations,
  createToolName,
  resolveToolNameConflicts,
  extractParameterValues,
  buildRequestUrl,
} from '../../../src/openapi/toolGenerator.js';
import type { Operation, McpTool } from '../../../src/core/types.js';

describe('toolGenerator', () => {
  const baseUrl = 'https://api.example.com';

  const sampleOperation: Operation = {
    operationId: 'getUsers',
    method: 'get',
    path: '/users',
    summary: 'List all users',
    description: 'Retrieves a list of all users in the system',
    parameters: [
      { name: 'limit', in: 'query', schema: { type: 'integer' }, required: false },
      { name: 'offset', in: 'query', schema: { type: 'integer' }, required: false },
    ],
  };

  describe('buildToolDescription', () => {
    it('includes summary', () => {
      const description = buildToolDescription(sampleOperation);
      expect(description).toContain('List all users');
    });

    it('includes method and path', () => {
      const description = buildToolDescription(sampleOperation);
      expect(description).toContain('[GET /users]');
    });

    it('marks deprecated operations', () => {
      const deprecated: Operation = { ...sampleOperation, deprecated: true };
      const description = buildToolDescription(deprecated);
      expect(description).toContain('[DEPRECATED]');
    });

    it('handles missing summary', () => {
      const noSummary: Operation = { method: 'get', path: '/test' };
      const description = buildToolDescription(noSummary);
      expect(description).toContain('[GET /test]');
    });

    it('truncates long descriptions', () => {
      const longDesc: Operation = {
        ...sampleOperation,
        description: 'A'.repeat(2000),
      };
      const description = buildToolDescription(longDesc);
      expect(description.length).toBeLessThanOrEqual(1024);
    });
  });

  describe('buildToolInputSchema', () => {
    it('creates schema from parameters', () => {
      const schema = buildToolInputSchema(sampleOperation);
      const result = schema.safeParse({ limit: 10, offset: 0 });
      expect(result.success).toBe(true);
    });

    it('handles path parameters as required', () => {
      const withPath: Operation = {
        ...sampleOperation,
        path: '/users/{id}',
        parameters: [
          { name: 'id', in: 'path', schema: { type: 'string' } },
        ],
      };
      const schema = buildToolInputSchema(withPath);
      expect(schema.safeParse({}).success).toBe(false);
      expect(schema.safeParse({ id: 'abc' }).success).toBe(true);
    });

    it('includes request body', () => {
      const withBody: Operation = {
        ...sampleOperation,
        method: 'post',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { name: { type: 'string' } } },
            },
          },
        },
      };
      const schema = buildToolInputSchema(withBody);
      const result = schema.safeParse({ body: { name: 'John' } });
      expect(result.success).toBe(true);
    });
  });

  describe('operationToTool', () => {
    it('creates tool with correct name', () => {
      const tool = operationToTool(baseUrl)(sampleOperation);
      expect(tool.name).toBe('getUsers');
    });

    it('includes description', () => {
      const tool = operationToTool(baseUrl)(sampleOperation);
      expect(tool.description).toContain('List all users');
    });

    it('preserves operation reference', () => {
      const tool = operationToTool(baseUrl)(sampleOperation);
      expect(tool.operation).toBe(sampleOperation);
    });

    it('stores baseUrl', () => {
      const tool = operationToTool(baseUrl)(sampleOperation);
      expect(tool.baseUrl).toBe(baseUrl);
    });

    it('generates name from path if no operationId', () => {
      const noId: Operation = { method: 'get', path: '/users' };
      const tool = operationToTool(baseUrl)(noId);
      expect(tool.name).toBe('get_users');
    });
  });

  describe('operationsToTools', () => {
    it('converts multiple operations', () => {
      const operations: Operation[] = [
        sampleOperation,
        { ...sampleOperation, operationId: 'getUser', path: '/users/{id}' },
      ];
      const tools = operationsToTools(baseUrl)(operations);
      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe('getUsers');
      expect(tools[1].name).toBe('getUser');
    });
  });

  describe('filterToolableOperations', () => {
    it('filters out operations without method', () => {
      const operations: Operation[] = [
        sampleOperation,
        { path: '/test' } as Operation,
      ];
      const filtered = filterToolableOperations(operations);
      expect(filtered).toHaveLength(1);
    });

    it('filters out operations without path', () => {
      const operations: Operation[] = [
        sampleOperation,
        { method: 'get' } as Operation,
      ];
      const filtered = filterToolableOperations(operations);
      expect(filtered).toHaveLength(1);
    });

    it('keeps operations with operationId or summary', () => {
      const operations: Operation[] = [
        sampleOperation,
        { method: 'get', path: '/test', summary: 'Test endpoint' },
      ];
      const filtered = filterToolableOperations(operations);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('createToolName', () => {
    it('uses operationId when available', () => {
      expect(createToolName(sampleOperation)).toBe('getusers');
    });

    it('generates from method and path', () => {
      const op: Operation = { method: 'post', path: '/users/{id}/activate' };
      expect(createToolName(op)).toBe('post_users_byid_activate');
    });

    it('removes invalid characters', () => {
      const op: Operation = { operationId: 'get-users@v2!', method: 'get', path: '/users' };
      expect(createToolName(op)).toBe('get_users_v2');
    });
  });

  describe('resolveToolNameConflicts', () => {
    it('appends counter to duplicate names', () => {
      const tools: McpTool[] = [
        { name: 'getUsers', description: '', inputSchema: {} as any, operation: sampleOperation, baseUrl },
        { name: 'getUsers', description: '', inputSchema: {} as any, operation: sampleOperation, baseUrl },
        { name: 'getUsers', description: '', inputSchema: {} as any, operation: sampleOperation, baseUrl },
      ];
      const resolved = resolveToolNameConflicts(tools);
      expect(resolved[0].name).toBe('getUsers');
      expect(resolved[1].name).toBe('getUsers_1');
      expect(resolved[2].name).toBe('getUsers_2');
    });

    it('preserves unique names', () => {
      const tools: McpTool[] = [
        { name: 'getUsers', description: '', inputSchema: {} as any, operation: sampleOperation, baseUrl },
        { name: 'createUser', description: '', inputSchema: {} as any, operation: sampleOperation, baseUrl },
      ];
      const resolved = resolveToolNameConflicts(tools);
      expect(resolved[0].name).toBe('getUsers');
      expect(resolved[1].name).toBe('createUser');
    });
  });

  describe('extractParameterValues', () => {
    it('extracts path parameters', () => {
      const op: Operation = {
        method: 'get',
        path: '/users/{id}',
        parameters: [{ name: 'id', in: 'path', schema: { type: 'string' } }],
      };
      const { pathParams } = extractParameterValues(op, { id: '123' });
      expect(pathParams.id).toBe('123');
    });

    it('extracts query parameters', () => {
      const { queryParams } = extractParameterValues(sampleOperation, { limit: 10 });
      expect(queryParams.limit).toBe(10);
    });

    it('extracts header parameters', () => {
      const op: Operation = {
        method: 'get',
        path: '/test',
        parameters: [{ name: 'X-Api-Key', in: 'header', schema: { type: 'string' } }],
      };
      const { headerParams } = extractParameterValues(op, { 'X-Api-Key': 'secret' });
      expect(headerParams['X-Api-Key']).toBe('secret');
    });

    it('extracts body', () => {
      const { body } = extractParameterValues(sampleOperation, { body: { name: 'John' } });
      expect(body).toEqual({ name: 'John' });
    });
  });

  describe('buildRequestUrl', () => {
    it('substitutes path parameters', () => {
      const url = buildRequestUrl(baseUrl, '/users/{id}', { id: '123' }, {});
      expect(url).toBe('https://api.example.com/users/123');
    });

    it('adds query parameters', () => {
      const url = buildRequestUrl(baseUrl, '/users', {}, { limit: 10, offset: 0 });
      expect(url).toContain('limit=10');
      expect(url).toContain('offset=0');
    });

    it('encodes path parameters', () => {
      const url = buildRequestUrl(baseUrl, '/users/{id}', { id: 'hello world' }, {});
      expect(url).toContain('hello%20world');
    });

    it('handles array query parameters', () => {
      const url = buildRequestUrl(baseUrl, '/users', {}, { tags: ['a', 'b'] });
      expect(url).toContain('tags=a');
      expect(url).toContain('tags=b');
    });
  });
});
