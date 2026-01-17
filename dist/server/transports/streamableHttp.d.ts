/**
 * Streamable HTTP transport for MCP server.
 * Implements the recommended HTTP transport for MCP protocol.
 * @module server/transports/streamableHttp
 */
import { Express, Router } from 'express';
import type { McpTool, McpResource, ServerConfig } from '../../core/types.js';
import { type ToolContext } from '../handlers.js';
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
 * Creates the MCP router with all endpoints.
 * @param config - Transport configuration
 * @returns Express router
 */
export declare const createMcpRouter: (config: StreamableHttpConfig) => Router;
/**
 * Creates a complete Express app with MCP endpoints.
 * @param config - Transport configuration
 * @returns Express application
 */
export declare const createMcpApp: (config: StreamableHttpConfig) => Express;
//# sourceMappingURL=streamableHttp.d.ts.map