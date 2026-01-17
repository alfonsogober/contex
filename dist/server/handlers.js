/**
 * MCP request handlers.
 * Pure functions for handling MCP protocol requests.
 * @module server/handlers
 */
import { ok, err, isErr } from '../core/result.js';
import { toolError } from '../core/errors.js';
import { validateInput } from '../openapi/schemaConverter.js';
import { extractParameterValues, buildRequestUrl } from '../openapi/toolGenerator.js';
import { buildToolRequest } from '../http/client.js';
/**
 * Creates a tool handler function.
 * @param tool - MCP tool definition
 * @param context - Execution context
 * @returns Handler function
 */
export const createToolHandler = (tool, context) => {
    return async (args) => {
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
export const executeTool = async (tool, args, context) => {
    const { operation, baseUrl } = tool;
    const { pathParams, queryParams, headerParams, body } = extractParameterValues(operation, args);
    const url = buildRequestUrl(baseUrl, operation.path, pathParams, queryParams);
    const requestConfig = buildToolRequest(operation.method, url, headerParams, body, context.token);
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
export const createResourceHandler = (resources, _context) => {
    const resourceMap = new Map(resources.map((r) => [r.uri, r]));
    return async (uri) => {
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
export const formatToolList = (tools) => tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: JSON.parse(JSON.stringify(tool.inputSchema)),
}));
/**
 * Formats resource list for MCP protocol.
 * @param resources - Array of resources
 * @returns Formatted resource list
 */
export const formatResourceList = (resources) => resources.map((resource) => ({
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
export const buildCapabilities = (tools, resources) => {
    const capabilities = {};
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
export const buildServerInfo = (name, version) => ({
    name,
    version,
});
/**
 * Validates tool arguments against schema.
 * @param tool - Tool definition
 * @param args - Arguments to validate
 * @returns Validation result
 */
export const validateToolArgs = (tool, args) => {
    const result = validateInput(tool.inputSchema, args);
    if (!result.success) {
        return err(toolError(`Invalid arguments: ${result.errors.message}`, tool.name));
    }
    return ok(result.data);
};
/**
 * Finds a tool by name.
 * @param tools - Array of tools
 * @param name - Tool name to find
 * @returns Tool or undefined
 */
export const findTool = (tools, name) => tools.find((t) => t.name === name);
/**
 * Finds a resource by URI.
 * @param resources - Array of resources
 * @param uri - Resource URI to find
 * @returns Resource or undefined
 */
export const findResource = (resources, uri) => resources.find((r) => r.uri === uri);
/**
 * Creates error response for MCP protocol.
 * @param code - Error code
 * @param message - Error message
 * @returns Error response object
 */
export const createErrorResponse = (code, message) => ({
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
};
//# sourceMappingURL=handlers.js.map