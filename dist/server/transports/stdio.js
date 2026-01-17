/**
 * Stdio transport for MCP server.
 * Implements the stdio transport for local MCP connections.
 * @module server/transports/stdio
 */
import * as readline from 'readline';
import { createToolHandler, formatToolList, formatResourceList, buildCapabilities, buildServerInfo, findTool, findResource, McpErrorCodes, } from '../handlers.js';
/**
 * Parses a JSON-RPC request from a line.
 * @param line - Input line
 * @returns Parsed request or null
 */
const parseRequest = (line) => {
    try {
        const parsed = JSON.parse(line);
        if (parsed.jsonrpc === '2.0' && typeof parsed.method === 'string') {
            return parsed;
        }
        return null;
    }
    catch {
        return null;
    }
};
/**
 * Writes a JSON-RPC response to stdout.
 * @param response - Response object
 */
const writeResponse = (response) => {
    process.stdout.write(JSON.stringify(response) + '\n');
};
/**
 * Handles a JSON-RPC request.
 * @param request - Parsed request
 * @param config - Transport configuration
 * @returns Response object
 */
const handleRequest = async (request, config) => {
    const baseResponse = { jsonrpc: '2.0', id: request.id };
    switch (request.method) {
        case 'initialize':
            return {
                ...baseResponse,
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: buildCapabilities(config.tools, config.resources),
                    serverInfo: buildServerInfo(config.serverName, config.serverVersion),
                },
            };
        case 'tools/list':
            return {
                ...baseResponse,
                result: {
                    tools: formatToolList(config.tools),
                },
            };
        case 'tools/call': {
            const params = request.params;
            const tool = findTool(config.tools, params.name);
            if (!tool) {
                return {
                    ...baseResponse,
                    error: {
                        code: McpErrorCodes.MethodNotFound,
                        message: `Tool not found: ${params.name}`,
                    },
                };
            }
            const handler = createToolHandler(tool, config.context);
            const result = await handler(params.arguments ?? {});
            return {
                ...baseResponse,
                result,
            };
        }
        case 'resources/list':
            return {
                ...baseResponse,
                result: {
                    resources: formatResourceList(config.resources),
                },
            };
        case 'resources/read': {
            const params = request.params;
            const resource = findResource(config.resources, params.uri);
            if (!resource) {
                return {
                    ...baseResponse,
                    error: {
                        code: McpErrorCodes.InvalidParams,
                        message: `Resource not found: ${params.uri}`,
                    },
                };
            }
            return {
                ...baseResponse,
                result: {
                    contents: [{
                            uri: resource.uri,
                            mimeType: resource.mimeType ?? 'application/json',
                            text: JSON.stringify({
                                name: resource.name,
                                description: resource.description,
                            }),
                        }],
                },
            };
        }
        case 'ping':
            return { ...baseResponse, result: {} };
        case 'notifications/initialized':
            return { ...baseResponse, result: null };
        default:
            return {
                ...baseResponse,
                error: {
                    code: McpErrorCodes.MethodNotFound,
                    message: `Unknown method: ${request.method}`,
                },
            };
    }
};
/**
 * Starts the stdio transport server.
 * @param config - Transport configuration
 * @returns Cleanup function
 */
export const startStdioServer = (config) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });
    rl.on('line', async (line) => {
        if (!line.trim())
            return;
        const request = parseRequest(line);
        if (!request) {
            writeResponse({
                jsonrpc: '2.0',
                error: {
                    code: McpErrorCodes.ParseError,
                    message: 'Invalid JSON-RPC request',
                },
            });
            return;
        }
        try {
            const response = await handleRequest(request, config);
            writeResponse(response);
        }
        catch (error) {
            writeResponse({
                jsonrpc: '2.0',
                id: request.id,
                error: {
                    code: McpErrorCodes.InternalError,
                    message: error instanceof Error ? error.message : 'Internal error',
                },
            });
        }
    });
    rl.on('close', () => {
        process.exit(0);
    });
    return () => {
        rl.close();
    };
};
/**
 * Creates a stdio message sender.
 * @returns Function to send messages
 */
export const createMessageSender = () => {
    return (method, params) => {
        const notification = {
            jsonrpc: '2.0',
            method,
            params,
        };
        process.stdout.write(JSON.stringify(notification) + '\n');
    };
};
/**
 * Sends a log message notification.
 * @param sender - Message sender function
 * @param level - Log level
 * @param message - Log message
 * @param data - Optional additional data
 */
export const sendLogMessage = (sender, level, message, data) => {
    sender('notifications/message', {
        level,
        logger: 'mcp-server',
        data: { message, ...(data ?? {}) },
    });
};
//# sourceMappingURL=stdio.js.map