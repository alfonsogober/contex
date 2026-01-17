/**
 * Generates MCP tools from OpenAPI operations.
 * Pure functions for transforming operations into tool definitions.
 * @module openapi/toolGenerator
 */
import * as R from 'ramda';
import { buildInputSchema } from './schemaConverter.js';
import { getOperationId, getPathParameters, getQueryParameters, getHeaderParameters, getRequestBodySchema, } from './parser.js';
import { isDefined, truncate } from '../utils/fp.js';
const MAX_DESCRIPTION_LENGTH = 1024;
/**
 * Builds a human-readable description for a tool.
 * @param operation - Source operation
 * @returns Tool description
 */
export const buildToolDescription = (operation) => {
    const parts = [];
    if (operation.summary) {
        parts.push(operation.summary);
    }
    if (operation.description && operation.description !== operation.summary) {
        parts.push(operation.description);
    }
    parts.push(`[${operation.method.toUpperCase()} ${operation.path}]`);
    if (operation.deprecated) {
        parts.unshift('[DEPRECATED]');
    }
    const description = parts.join(' - ');
    return truncate(MAX_DESCRIPTION_LENGTH)(description);
};
/**
 * Converts an OpenAPI parameter to a schema entry.
 * @param param - OpenAPI parameter definition
 * @returns Parameter schema entry
 */
const parameterToSchemaEntry = (param) => ({
    name: param.name,
    schema: param.schema,
    required: param.required ?? param.in === 'path',
});
/**
 * Builds the input schema for a tool from operation parameters.
 * @param operation - Source operation
 * @returns Zod schema for tool input
 */
export const buildToolInputSchema = (operation) => {
    const pathParams = getPathParameters(operation).map(parameterToSchemaEntry);
    const queryParams = getQueryParameters(operation).map(parameterToSchemaEntry);
    const headerParams = getHeaderParameters(operation).map(parameterToSchemaEntry);
    const allParams = [...pathParams, ...queryParams, ...headerParams];
    const requestBodySchema = getRequestBodySchema(operation);
    return buildInputSchema(allParams, requestBodySchema);
};
/**
 * Converts a single OpenAPI operation to an MCP tool definition.
 * @param baseUrl - Base URL for API calls
 * @returns A function that converts an operation to a tool
 */
export const operationToTool = (baseUrl) => (operation) => ({
    name: getOperationId(operation),
    description: buildToolDescription(operation),
    inputSchema: buildToolInputSchema(operation),
    operation,
    baseUrl,
});
/**
 * Converts multiple operations to MCP tools.
 * @param baseUrl - Base URL for API calls
 * @returns A function that converts operations to tools
 */
export const operationsToTools = (baseUrl) => (operations) => R.map(operationToTool(baseUrl), operations);
/**
 * Filters operations suitable for tool conversion.
 * Excludes operations without proper definitions.
 * @param operations - Array of operations
 * @returns Filtered operations
 */
export const filterToolableOperations = (operations) => R.filter((op) => isDefined(op.method) &&
    isDefined(op.path) &&
    (isDefined(op.operationId) || isDefined(op.summary)), operations);
/**
 * Groups tools by their tag for organized registration.
 * @param tools - Array of tools
 * @returns Tools grouped by tag
 */
export const groupToolsByTag = (tools) => R.groupBy((tool) => tool.operation.tags?.[0] ?? 'default', tools);
/**
 * Creates a tool name from operation details.
 * Ensures name is valid for MCP (alphanumeric and underscores).
 * @param operation - Source operation
 * @returns Valid tool name
 */
export const createToolName = (operation) => {
    const raw = getOperationId(operation);
    return raw
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .toLowerCase();
};
/**
 * Validates that a tool name is unique within a set.
 * @param tools - Existing tools
 * @param name - Name to check
 * @returns True if name is unique
 */
export const isUniqueToolName = (tools, name) => !tools.some((t) => t.name === name);
/**
 * Resolves duplicate tool names by appending a counter.
 * @param tools - Array of tools
 * @returns Tools with unique names
 */
export const resolveToolNameConflicts = (tools) => {
    const nameCount = new Map();
    return tools.map((tool) => {
        const baseName = tool.name;
        const count = nameCount.get(baseName) ?? 0;
        nameCount.set(baseName, count + 1);
        if (count === 0)
            return tool;
        return {
            ...tool,
            name: `${baseName}_${count}`,
        };
    });
};
/**
 * Pipeline to convert operations to tools with all transformations.
 * @param baseUrl - Base URL for API calls
 * @returns A function that transforms operations to tools
 */
export const buildToolsPipeline = (baseUrl) => R.pipe(filterToolableOperations, operationsToTools(baseUrl), resolveToolNameConflicts);
/**
 * Extracts parameter values from tool input for URL substitution.
 * @param operation - Source operation
 * @param input - Tool input object
 * @returns Object with extracted values by category
 */
export const extractParameterValues = (operation, input) => {
    const pathParams = {};
    const queryParams = {};
    const headerParams = {};
    for (const param of getPathParameters(operation)) {
        const value = input[param.name];
        if (isDefined(value)) {
            pathParams[param.name] = String(value);
        }
    }
    for (const param of getQueryParameters(operation)) {
        const value = input[param.name];
        if (isDefined(value)) {
            queryParams[param.name] = value;
        }
    }
    for (const param of getHeaderParameters(operation)) {
        const value = input[param.name];
        if (isDefined(value)) {
            headerParams[param.name] = String(value);
        }
    }
    return {
        pathParams,
        queryParams,
        headerParams,
        body: input['body'],
    };
};
/**
 * Builds the full URL for a tool execution.
 * @param baseUrl - Base URL
 * @param path - Path template
 * @param pathParams - Path parameter values
 * @param queryParams - Query parameter values
 * @returns Complete URL
 */
export const buildRequestUrl = (baseUrl, path, pathParams, queryParams) => {
    let url = path;
    for (const [name, value] of Object.entries(pathParams)) {
        url = url.replace(`{${name}}`, encodeURIComponent(value));
    }
    const fullUrl = new URL(url, baseUrl);
    for (const [name, value] of Object.entries(queryParams)) {
        if (isDefined(value)) {
            if (Array.isArray(value)) {
                value.forEach((v) => fullUrl.searchParams.append(name, String(v)));
            }
            else {
                fullUrl.searchParams.set(name, String(value));
            }
        }
    }
    return fullUrl.toString();
};
//# sourceMappingURL=toolGenerator.js.map