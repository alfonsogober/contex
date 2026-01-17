/**
 * Stdio transport for MCP server.
 * Implements the stdio transport for local MCP connections.
 * @module server/transports/stdio
 */
import type { McpTool, McpResource } from '../../core/types.js';
import { type ToolContext } from '../handlers.js';
/**
 * Stdio transport configuration.
 */
export interface StdioConfig {
    readonly serverName: string;
    readonly serverVersion: string;
    readonly tools: McpTool[];
    readonly resources: McpResource[];
    readonly context: ToolContext;
}
/**
 * Starts the stdio transport server.
 * @param config - Transport configuration
 * @returns Cleanup function
 */
export declare const startStdioServer: (config: StdioConfig) => (() => void);
/**
 * Creates a stdio message sender.
 * @returns Function to send messages
 */
export declare const createMessageSender: () => ((method: string, params?: unknown) => void);
/**
 * Sends a log message notification.
 * @param sender - Message sender function
 * @param level - Log level
 * @param message - Log message
 * @param data - Optional additional data
 */
export declare const sendLogMessage: (sender: (method: string, params?: unknown) => void, level: "debug" | "info" | "warning" | "error", message: string, data?: unknown) => void;
//# sourceMappingURL=stdio.d.ts.map