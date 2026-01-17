/**
 * Main server factory for creating MCP servers.
 * Provides the primary API for the library.
 * @module server/createServer
 */
import type { Express } from 'express';
import { Result } from '../core/result.js';
import { type ConfigError, type McpError } from '../core/errors.js';
import type { McpServerConfig, McpTool, McpResource, ServerConfig } from '../core/types.js';
/**
 * MCP Server instance.
 */
export interface McpServer {
    readonly name: string;
    readonly version: string;
    readonly tools: McpTool[];
    readonly resources: McpResource[];
    readonly start: () => Promise<void>;
    readonly stop: () => Promise<void>;
    readonly getApp: () => Express | undefined;
}
/**
 * Validates the MCP server configuration.
 * @param config - Configuration to validate
 * @returns Result containing config or error
 */
export declare const validateConfig: (config: McpServerConfig) => Result<McpServerConfig, ConfigError>;
/**
 * Creates an MCP server from configuration.
 * @param config - Server configuration
 * @returns Result containing server instance or error
 */
export declare const createMcpServer: (config: McpServerConfig) => Promise<Result<McpServer, McpError>>;
/**
 * Creates a minimal MCP server with custom tools.
 * @param name - Server name
 * @param version - Server version
 * @param tools - Custom tool definitions
 * @param resources - Custom resource definitions
 * @param config - Optional server configuration
 * @returns Result containing server instance
 */
export declare const createCustomMcpServer: (name: string, version: string, tools: McpTool[], resources: McpResource[], config?: Partial<ServerConfig>) => Promise<Result<McpServer, McpError>>;
//# sourceMappingURL=createServer.d.ts.map