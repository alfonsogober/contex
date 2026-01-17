/**
 * MCP request handlers.
 * Pure functions for handling MCP protocol requests.
 * @module server/handlers
 */

import { Result, ok, err, isErr } from '../core/result.js';
import { toolError, type ToolError, type McpError } from '../core/errors.js';
import type { McpTool, McpResource, TokenSet } from '../core/types.js';
import { validateInput } from '../openapi/schemaConverter.js';
import { extractParameterValues, buildRequestUrl } from '../openapi/toolGenerator.js';
import { buildToolRequest, type HttpClient } from '../http/client.js';

/**
 * Tool execution context.
 */
export interface ToolContext {
  readonly httpClient: HttpClient;
  readonly token?: TokenSet;
}

/**
 * Tool execution result.
 */
export interface ToolExecutionResult {
  readonly content: Array<{ type: 'text'; text: string }>;
  readonly isError?: boolean;
}

/**
 * Creates a tool handler function.
 * @param tool - MCP tool definition
 * @param context - Execution context
 * @returns Handler function
 */
export const createToolHandler = (
  tool: McpTool,
  context: ToolContext
): ((args: Record<string, unknown>) => Promise<ToolExecutionResult>) => {
  return async (args: Record<string, unknown>): Promise<ToolExecutionResult> => {
    const validationResult = validateInput(tool.inputSchema, args);
    
    if (!validationResult.success) {
      return {
        content: [{
          type: 'text',
          text: `Validation error: ${validationResult.errors.message}`,
        }],
        isError: true,
      };
    }
    
    const executionResult = await executeTool(tool, args, context);
    
    if (isErr(executionResult)) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${executionResult.error.message}`,
        }],
        isError: true,
      };
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(executionResult.value, null, 2),
      }],
    };
  };
};

/**
 * Executes a tool by making the corresponding API call.
 * @param tool - MCP tool
 * @param args - Tool arguments
 * @param context - Execution context
 * @returns Result containing response data or error
 */
export const executeTool = async (
  tool: McpTool,
  args: Record<string, unknown>,
  context: ToolContext
): Promise<Result<unknown, ToolError>> => {
  const { operation, baseUrl } = tool;
  const { pathParams, queryParams, headerParams, body } = extractParameterValues(
    operation,
    args
  );
  
  const url = buildRequestUrl(baseUrl, operation.path, pathParams, queryParams);
  
  const requestConfig = buildToolRequest(
    operation.method,
    url,
    headerParams,
    body,
    context.token
  );
  
  const response = await context.httpClient.request(requestConfig);
  
  if (isErr(response)) {
    return err(toolError(response.error.message, tool.name, response.error));
  }
  
  return ok(response.value.data);
};

/**
 * Creates resource read handler.
 * @param resources - Available resources
 * @param context - Execution context
 * @returns Handler function
 */
export const createResourceHandler = (
  resources: McpResource[],
  _context: ToolContext
): ((uri: string) => Promise<Result<unknown, McpError>>) => {
  const resourceMap = new Map(resources.map((r) => [r.uri, r]));
  
  return async (uri: string): Promise<Result<unknown, McpError>> => {
    const resource = resourceMap.get(uri);
    
    if (!resource) {
      return err(toolError(`Resource not found: ${uri}`, 'readResource'));
    }
    
    if (uri.startsWith('schema://')) {
      return ok({ uri, name: resource.name, description: resource.description });
    }
    
    return ok({ uri, name: resource.name, mimeType: resource.mimeType });
  };
};

/**
 * Formats tool list for MCP protocol.
 * @param tools - Array of tools
 * @returns Formatted tool list
 */
export const formatToolList = (
  tools: McpTool[]
): Array<{
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}> =>
  tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: JSON.parse(JSON.stringify(tool.inputSchema)),
  }));

/**
 * Formats resource list for MCP protocol.
 * @param resources - Array of resources
 * @returns Formatted resource list
 */
export const formatResourceList = (
  resources: McpResource[]
): Array<{
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}> =>
  resources.map((resource) => ({
    uri: resource.uri,
    name: resource.name,
    description: resource.description,
    mimeType: resource.mimeType,
  }));

/**
 * Builds server capabilities object.
 * @param tools - Available tools
 * @param resources - Available resources
 * @returns Capabilities object
 */
export const buildCapabilities = (
  tools: McpTool[],
  resources: McpResource[]
): {
  tools?: Record<string, never>;
  resources?: Record<string, never>;
} => {
  const capabilities: {
    tools?: Record<string, never>;
    resources?: Record<string, never>;
  } = {};
  
  if (tools.length > 0) {
    capabilities.tools = {};
  }
  
  if (resources.length > 0) {
    capabilities.resources = {};
  }
  
  return capabilities;
};

/**
 * Builds server info object.
 * @param name - Server name
 * @param version - Server version
 * @returns Server info
 */
export const buildServerInfo = (
  name: string,
  version: string
): { name: string; version: string } => ({
  name,
  version,
});

/**
 * Validates tool arguments against schema.
 * @param tool - Tool definition
 * @param args - Arguments to validate
 * @returns Validation result
 */
export const validateToolArgs = (
  tool: McpTool,
  args: unknown
): Result<Record<string, unknown>, ToolError> => {
  const result = validateInput(tool.inputSchema, args);
  
  if (!result.success) {
    return err(toolError(
      `Invalid arguments: ${result.errors.message}`,
      tool.name
    ));
  }
  
  return ok(result.data as Record<string, unknown>);
};

/**
 * Finds a tool by name.
 * @param tools - Array of tools
 * @param name - Tool name to find
 * @returns Tool or undefined
 */
export const findTool = (
  tools: McpTool[],
  name: string
): McpTool | undefined =>
  tools.find((t) => t.name === name);

/**
 * Finds a resource by URI.
 * @param resources - Array of resources
 * @param uri - Resource URI to find
 * @returns Resource or undefined
 */
export const findResource = (
  resources: McpResource[],
  uri: string
): McpResource | undefined =>
  resources.find((r) => r.uri === uri);

/**
 * Creates error response for MCP protocol.
 * @param code - Error code
 * @param message - Error message
 * @returns Error response object
 */
export const createErrorResponse = (
  code: number,
  message: string
): { error: { code: number; message: string } } => ({
  error: { code, message },
});

/**
 * MCP error codes.
 */
export const McpErrorCodes = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
} as const;
