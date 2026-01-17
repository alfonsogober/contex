/**
 * MCP request handlers.
 * Pure functions for handling MCP protocol requests.
 * @module server/handlers
 */
import { Result } from '../core/result.js';
import { type ToolError, type McpError } from '../core/errors.js';
import type { McpTool, McpResource, TokenSet } from '../core/types.js';
import { type HttpClient } from '../http/client.js';
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
    readonly content: Array<{
        type: 'text';
        text: string;
    }>;
    readonly isError?: boolean;
}
/**
 * Creates a tool handler function.
 * @param tool - MCP tool definition
 * @param context - Execution context
 * @returns Handler function
 */
export declare const createToolHandler: (tool: McpTool, context: ToolContext) => ((args: Record<string, unknown>) => Promise<ToolExecutionResult>);
/**
 * Executes a tool by making the corresponding API call.
 * @param tool - MCP tool
 * @param args - Tool arguments
 * @param context - Execution context
 * @returns Result containing response data or error
 */
export declare const executeTool: (tool: McpTool, args: Record<string, unknown>, context: ToolContext) => Promise<Result<unknown, ToolError>>;
/**
 * Creates resource read handler.
 * @param resources - Available resources
 * @param context - Execution context
 * @returns Handler function
 */
export declare const createResourceHandler: (resources: McpResource[], _context: ToolContext) => ((uri: string) => Promise<Result<unknown, McpError>>);
/**
 * Formats tool list for MCP protocol.
 * @param tools - Array of tools
 * @returns Formatted tool list
 */
export declare const formatToolList: (tools: McpTool[]) => Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}>;
/**
 * Formats resource list for MCP protocol.
 * @param resources - Array of resources
 * @returns Formatted resource list
 */
export declare const formatResourceList: (resources: McpResource[]) => Array<{
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}>;
/**
 * Builds server capabilities object.
 * @param tools - Available tools
 * @param resources - Available resources
 * @returns Capabilities object
 */
export declare const buildCapabilities: (tools: McpTool[], resources: McpResource[]) => {
    tools?: Record<string, never>;
    resources?: Record<string, never>;
};
/**
 * Builds server info object.
 * @param name - Server name
 * @param version - Server version
 * @returns Server info
 */
export declare const buildServerInfo: (name: string, version: string) => {
    name: string;
    version: string;
};
/**
 * Validates tool arguments against schema.
 * @param tool - Tool definition
 * @param args - Arguments to validate
 * @returns Validation result
 */
export declare const validateToolArgs: (tool: McpTool, args: unknown) => Result<Record<string, unknown>, ToolError>;
/**
 * Finds a tool by name.
 * @param tools - Array of tools
 * @param name - Tool name to find
 * @returns Tool or undefined
 */
export declare const findTool: (tools: McpTool[], name: string) => McpTool | undefined;
/**
 * Finds a resource by URI.
 * @param resources - Array of resources
 * @param uri - Resource URI to find
 * @returns Resource or undefined
 */
export declare const findResource: (resources: McpResource[], uri: string) => McpResource | undefined;
/**
 * Creates error response for MCP protocol.
 * @param code - Error code
 * @param message - Error message
 * @returns Error response object
 */
export declare const createErrorResponse: (code: number, message: string) => {
    error: {
        code: number;
        message: string;
    };
};
/**
 * MCP error codes.
 */
export declare const McpErrorCodes: {
    readonly ParseError: -32700;
    readonly InvalidRequest: -32600;
    readonly MethodNotFound: -32601;
    readonly InvalidParams: -32602;
    readonly InternalError: -32603;
};
//# sourceMappingURL=handlers.d.ts.map