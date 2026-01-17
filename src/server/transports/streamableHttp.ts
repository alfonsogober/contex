/**
 * Streamable HTTP transport for MCP server.
 * Implements the recommended HTTP transport for MCP protocol.
 * @module server/transports/streamableHttp
 */

import express, { Express, Request, Response, Router } from 'express';
import type { McpTool, McpResource, ServerConfig } from '../../core/types.js';
import {
  createToolHandler,
  formatToolList,
  formatResourceList,
  buildCapabilities,
  buildServerInfo,
  findTool,
  findResource,
  McpErrorCodes,
  type ToolContext,
} from '../handlers.js';

/**
 * Session state for stateful connections.
 */
interface Session {
  readonly id: string;
  readonly createdAt: number;
  readonly lastActivity: number;
}

/**
 * Transport configuration.
 */
export interface StreamableHttpConfig {
  readonly serverName: string;
  readonly serverVersion: string;
  readonly tools: McpTool[];
  readonly resources: McpResource[];
  readonly context: ToolContext;
  readonly cors?: ServerConfig['cors'];
  readonly stateful?: boolean;
}

/**
 * Creates CORS middleware.
 * @param config - CORS configuration
 * @returns Express middleware
 */
const createCorsMiddleware = (config?: ServerConfig['cors']) => {
  return (req: Request, res: Response, next: () => void): void => {
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
const generateSessionId = (): string =>
  `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

/**
 * Creates the MCP router with all endpoints.
 * @param config - Transport configuration
 * @returns Express router
 */
export const createMcpRouter = (config: StreamableHttpConfig): Router => {
  const router = Router();
  const sessions = new Map<string, Session>();
  
  router.use(express.json());
  router.use(createCorsMiddleware(config.cors));
  
  router.post('/mcp', async (req: Request, res: Response): Promise<void> => {
    const { method, params, id } = req.body;
    
    let sessionId = req.headers['mcp-session-id'] as string | undefined;
    
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
    } catch (error) {
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
  
  router.get('/mcp', (req: Request, res: Response): void => {
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
  
  router.delete('/mcp', (req: Request, res: Response): void => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    
    if (sessionId && sessions.has(sessionId)) {
      sessions.delete(sessionId);
      res.status(204).end();
    } else {
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
const handleMcpRequest = async (
  method: string,
  params: unknown,
  id: string | number,
  config: StreamableHttpConfig
): Promise<object> => {
  const response = { jsonrpc: '2.0' as const, id };
  
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
      const { name, arguments: args } = params as { name: string; arguments: Record<string, unknown> };
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
      const { uri } = params as { uri: string };
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
export const createMcpApp = (config: StreamableHttpConfig): Express => {
  const app = express();
  
  app.use(createMcpRouter(config));
  
  app.get('/health', (_req: Request, res: Response): void => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
  
  return app;
};
