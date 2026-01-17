/**
 * Generates MCP tools from OpenAPI operations.
 * Pure functions for transforming operations into tool definitions.
 * @module openapi/toolGenerator
 */
import type { ZodTypeAny } from 'zod';
import type { Operation, McpTool } from '../core/types.js';
/**
 * Builds a human-readable description for a tool.
 * @param operation - Source operation
 * @returns Tool description
 */
export declare const buildToolDescription: (operation: Operation) => string;
/**
 * Builds the input schema for a tool from operation parameters.
 * @param operation - Source operation
 * @returns Zod schema for tool input
 */
export declare const buildToolInputSchema: (operation: Operation) => ZodTypeAny;
/**
 * Converts a single OpenAPI operation to an MCP tool definition.
 * @param baseUrl - Base URL for API calls
 * @returns A function that converts an operation to a tool
 */
export declare const operationToTool: (baseUrl: string) => (operation: Operation) => McpTool;
/**
 * Converts multiple operations to MCP tools.
 * @param baseUrl - Base URL for API calls
 * @returns A function that converts operations to tools
 */
export declare const operationsToTools: (baseUrl: string) => (operations: Operation[]) => McpTool[];
/**
 * Filters operations suitable for tool conversion.
 * Excludes operations without proper definitions.
 * @param operations - Array of operations
 * @returns Filtered operations
 */
export declare const filterToolableOperations: (operations: Operation[]) => Operation[];
/**
 * Groups tools by their tag for organized registration.
 * @param tools - Array of tools
 * @returns Tools grouped by tag
 */
export declare const groupToolsByTag: (tools: McpTool[]) => Record<string, McpTool[]>;
/**
 * Creates a tool name from operation details.
 * Ensures name is valid for MCP (alphanumeric and underscores).
 * @param operation - Source operation
 * @returns Valid tool name
 */
export declare const createToolName: (operation: Operation) => string;
/**
 * Validates that a tool name is unique within a set.
 * @param tools - Existing tools
 * @param name - Name to check
 * @returns True if name is unique
 */
export declare const isUniqueToolName: (tools: McpTool[], name: string) => boolean;
/**
 * Resolves duplicate tool names by appending a counter.
 * @param tools - Array of tools
 * @returns Tools with unique names
 */
export declare const resolveToolNameConflicts: (tools: McpTool[]) => McpTool[];
/**
 * Pipeline to convert operations to tools with all transformations.
 * @param baseUrl - Base URL for API calls
 * @returns A function that transforms operations to tools
 */
export declare const buildToolsPipeline: (baseUrl: string) => (operations: Operation[]) => McpTool[];
/**
 * Extracts parameter values from tool input for URL substitution.
 * @param operation - Source operation
 * @param input - Tool input object
 * @returns Object with extracted values by category
 */
export declare const extractParameterValues: (operation: Operation, input: Record<string, unknown>) => {
    pathParams: Record<string, string>;
    queryParams: Record<string, unknown>;
    headerParams: Record<string, string>;
    body: unknown;
};
/**
 * Builds the full URL for a tool execution.
 * @param baseUrl - Base URL
 * @param path - Path template
 * @param pathParams - Path parameter values
 * @param queryParams - Query parameter values
 * @returns Complete URL
 */
export declare const buildRequestUrl: (baseUrl: string, path: string, pathParams: Record<string, string>, queryParams: Record<string, unknown>) => string;
//# sourceMappingURL=toolGenerator.d.ts.map