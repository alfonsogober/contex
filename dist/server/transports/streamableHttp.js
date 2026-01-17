/**
 * Streamable HTTP transport for MCP server.
 * Implements the recommended HTTP transport for MCP protocol.
 * @module server/transports/streamableHttp
 */
import express, { Router } from 'express';
import { createToolHandler, formatToolList, formatResourceList, buildCapabilities, buildServerInfo, findTool, findResource, McpErrorCodes, } from '../handlers.js';
/**
 * Creates CORS middleware.
 * @param config - CORS configuration
 * @returns Express middleware
 */
const createCorsMiddleware = (config) => {
    return (req, res, next) => {
        const origin = config?.origin ?? '*';
        res.header('Access-Control-Allow-Origin', Array.isArray(origin) ? origin[0] : origin);
        res.header('Access-Control-Allow-Methods', config?.methods?.join(', ') ?? 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', config?.allowedHeaders?.join(', ') ?? 'Content-Type, Authorization, Mcp-Session-Id');
        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }
        next();
    };
};
/**
 * Generates a unique session ID.
 * @returns Session ID string
 */
const generateSessionId = () => `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
/**
 * Creates the MCP router with all endpoints.
 * @param config - Transport configuration
 * @returns Express router
 */
export const createMcpRouter = (config) => {
    const router = Router();
    const sessions = new Map();
    router.use(express.json());
    router.use(createCorsMiddleware(config.cors));
    router.post('/mcp', async (req, res) => {
        const { method, params, id } = req.body;
        let sessionId = req.headers['mcp-session-id'];
        if (config.stateful && !sessionId) {
            sessionId = generateSessionId();
            sessions.set(sessionId, {
                id: sessionId,
                createdAt: Date.now(),
                lastActivity: Date.now(),
            });
        }
        if (sessionId) {
            res.header('Mcp-Session-Id', sessionId);
        }
        try {
            const result = await handleMcpRequest(method, params, id, config);
            res.json(result);
        }
        catch (error) {
            res.json({
                jsonrpc: '2.0',
                id,
                error: {
                    code: McpErrorCodes.InternalError,
                    message: error instanceof Error ? error.message : 'Internal error',
                },
            });
        }
    });
    router.get('/mcp', (req, res) => {
        res.header('Content-Type', 'text/event-stream');
        res.header('Cache-Control', 'no-cache');
        res.header('Connection', 'keep-alive');
        res.write('event: ping\ndata: {}\n\n');
        const pingInterval = setInterval(() => {
            res.write('event: ping\ndata: {}\n\n');
        }, 30000);
        req.on('close', () => {
            clearInterval(pingInterval);
        });
    });
    router.delete('/mcp', (req, res) => {
        const sessionId = req.headers['mcp-session-id'];
        if (sessionId && sessions.has(sessionId)) {
            sessions.delete(sessionId);
            res.status(204).end();
        }
        else {
            res.status(404).json({ error: 'Session not found' });
        }
    });
    return router;
};
/**
 * Handles individual MCP requests.
 * @param method - RPC method name
 * @param params - Method parameters
 * @param id - Request ID
 * @param config - Transport configuration
 * @returns JSON-RPC response
 */
const handleMcpRequest = async (method, params, id, config) => {
    const response = { jsonrpc: '2.0', id };
    switch (method) {
        case 'initialize':
            return {
                ...response,
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: buildCapabilities(config.tools, config.resources),
                    serverInfo: buildServerInfo(config.serverName, config.serverVersion),
                },
            };
        case 'tools/list':
            return {
                ...response,
                result: {
                    tools: formatToolList(config.tools),
                },
            };
        case 'tools/call': {
            const { name, arguments: args } = params;
            const tool = findTool(config.tools, name);
            if (!tool) {
                return {
                    ...response,
                    error: {
                        code: McpErrorCodes.MethodNotFound,
                        message: `Tool not found: ${name}`,
                    },
                };
            }
            const handler = createToolHandler(tool, config.context);
            const result = await handler(args ?? {});
            return {
                ...response,
                result,
            };
        }
        case 'resources/list':
            return {
                ...response,
                result: {
                    resources: formatResourceList(config.resources),
                },
            };
        case 'resources/read': {
            const { uri } = params;
            const resource = findResource(config.resources, uri);
            if (!resource) {
                return {
                    ...response,
                    error: {
                        code: McpErrorCodes.InvalidParams,
                        message: `Resource not found: ${uri}`,
                    },
                };
            }
            return {
                ...response,
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
            return { ...response, result: {} };
        case 'notifications/initialized':
            return { ...response, result: null };
        default:
            return {
                ...response,
                error: {
                    code: McpErrorCodes.MethodNotFound,
                    message: `Unknown method: ${method}`,
                },
            };
    }
};
/**
 * Creates a complete Express app with MCP endpoints.
 * @param config - Transport configuration
 * @returns Express application
 */
export const createMcpApp = (config) => {
    const app = express();
    app.use(createMcpRouter(config));
    app.get('/health', (_req, res) => {
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    return app;
};
//# sourceMappingURL=streamableHttp.js.map