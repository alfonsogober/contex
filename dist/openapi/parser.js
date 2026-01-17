/**
 * OpenAPI specification parser.
 * Provides pure functions for parsing and extracting data from OpenAPI specs.
 * @module openapi/parser
 */
import * as R from 'ramda';
import SwaggerParser from '@apidevtools/swagger-parser';
import { ok, err, tryCatchAsync } from '../core/result.js';
import { parseError } from '../core/errors.js';
import { isObject, compact } from '../utils/fp.js';
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
/**
 * Validates if a string is a valid HTTP method.
 * @param method - String to validate
 * @returns True if valid HTTP method
 */
export const isHttpMethod = (method) => HTTP_METHODS.includes(method);
/**
 * Parses an OpenAPI specification from a file path, URL, or object.
 * @param spec - Path, URL, or OpenAPI object
 * @returns Result containing parsed spec or error
 */
export const parseOpenApiSpec = async (spec) => tryCatchAsync(async () => {
    const parsed = await SwaggerParser.dereference(spec);
    return parsed;
}, (e) => parseError(e instanceof Error ? e.message : 'Failed to parse OpenAPI spec', typeof spec === 'string' ? spec : 'inline object', e));
/**
 * Validates that the spec is a supported OpenAPI version.
 * @param spec - Parsed OpenAPI specification
 * @returns Result containing spec or error
 */
export const validateOpenApiVersion = (spec) => {
    const version = spec.openapi;
    if (!version || !version.startsWith('3.')) {
        return err(parseError(`Unsupported OpenAPI version: ${version}. Only 3.x is supported.`, 'openapi version'));
    }
    return ok(spec);
};
/**
 * Extracts the operation object from a path item.
 * @param pathItem - Path item object
 * @param method - HTTP method
 * @returns Operation data or undefined
 */
const extractOperationFromPathItem = (pathItem, method) => {
    const operation = pathItem[method];
    return isObject(operation) ? operation : undefined;
};
/**
 * Builds an Operation from raw operation data.
 * @param method - HTTP method
 * @param path - URL path
 * @param rawOperation - Raw operation object
 * @returns Operation object
 */
const buildOperation = (method, path, rawOperation) => ({
    operationId: rawOperation.operationId,
    method,
    path,
    summary: rawOperation.summary,
    description: rawOperation.description,
    parameters: rawOperation.parameters,
    requestBody: rawOperation.requestBody,
    responses: rawOperation.responses,
    security: rawOperation.security,
    tags: rawOperation.tags,
    deprecated: rawOperation.deprecated,
});
/**
 * Extracts all operations from an OpenAPI path item.
 * @param path - URL path
 * @param pathItem - Path item object
 * @returns Array of operations
 */
const extractOperationsFromPath = (path, pathItem) => R.pipe(R.filter(isHttpMethod), R.map((method) => {
    const rawOp = extractOperationFromPathItem(pathItem, method);
    return rawOp ? buildOperation(method, path, rawOp) : undefined;
}), compact)(HTTP_METHODS);
/**
 * Extracts all operations from an OpenAPI specification.
 * Pure function that transforms spec into array of operations.
 * @param spec - Parsed OpenAPI specification
 * @returns Array of all operations
 */
export const extractOperations = (spec) => R.pipe(R.toPairs, R.chain(([path, pathItem]) => isObject(pathItem) ? extractOperationsFromPath(path, pathItem) : []))(spec.paths);
/**
 * Filters operations by tag.
 * @param tag - Tag to filter by
 * @returns A function that filters operations
 */
export const filterByTag = (tag) => (operations) => R.filter((op) => op.tags?.includes(tag) ?? false, operations);
/**
 * Filters out deprecated operations.
 * @param operations - Array of operations
 * @returns Non-deprecated operations
 */
export const filterNonDeprecated = (operations) => R.filter((op) => !op.deprecated, operations);
/**
 * Groups operations by their first tag.
 * @param operations - Array of operations
 * @returns Operations grouped by tag
 */
export const groupByTag = (operations) => R.groupBy((op) => op.tags?.[0] ?? 'default', operations);
/**
 * Generates an operation ID from method and path if not provided.
 * @param operation - Operation object
 * @returns Operation ID
 */
export const getOperationId = (operation) => {
    if (operation.operationId)
        return operation.operationId;
    const pathParts = operation.path
        .split('/')
        .filter(Boolean)
        .map((part) => part.startsWith('{') ? `By${part.slice(1, -1)}` : part);
    return `${operation.method}_${pathParts.join('_')}`;
};
/**
 * Extracts all parameter names from an operation.
 * @param operation - Operation object
 * @returns Array of parameter names
 */
export const getParameterNames = (operation) => (operation.parameters ?? []).map((p) => p.name);
/**
 * Extracts path parameters from an operation.
 * @param operation - Operation object
 * @returns Array of path parameters
 */
export const getPathParameters = (operation) => (operation.parameters ?? []).filter((p) => p.in === 'path');
/**
 * Extracts query parameters from an operation.
 * @param operation - Operation object
 * @returns Array of query parameters
 */
export const getQueryParameters = (operation) => (operation.parameters ?? []).filter((p) => p.in === 'query');
/**
 * Extracts header parameters from an operation.
 * @param operation - Operation object
 * @returns Array of header parameters
 */
export const getHeaderParameters = (operation) => (operation.parameters ?? []).filter((p) => p.in === 'header');
/**
 * Extracts the request body schema from an operation.
 * @param operation - Operation object
 * @returns Request body schema or undefined
 */
export const getRequestBodySchema = (operation) => {
    const content = operation.requestBody?.content;
    if (!content)
        return undefined;
    const jsonContent = content['application/json'];
    return jsonContent?.schema;
};
/**
 * Extracts the success response schema from an operation.
 * Looks for 200, 201, or 2xx responses.
 * @param operation - Operation object
 * @returns Success response schema or undefined
 */
export const getSuccessResponseSchema = (operation) => {
    const responses = operation.responses;
    if (!responses)
        return undefined;
    const successResponse = responses['200'] ?? responses['201'] ?? responses['2XX'];
    const content = successResponse?.content;
    if (!content)
        return undefined;
    const jsonContent = content['application/json'];
    return jsonContent?.schema;
};
/**
 * Extracts all schemas from the components section.
 * @param spec - OpenAPI specification
 * @returns Record of schema name to schema
 */
export const extractSchemas = (spec) => spec.components?.schemas ?? {};
/**
 * Extracts security schemes from the components section.
 * @param spec - OpenAPI specification
 * @returns Record of security scheme name to scheme
 */
export const extractSecuritySchemes = (spec) => spec.components?.securitySchemes ?? {};
/**
 * Gets the base URL from the spec's servers array.
 * @param spec - OpenAPI specification
 * @returns Base URL or empty string
 */
export const getBaseUrl = (spec) => spec.servers?.[0]?.url ?? '';
/**
 * Checks if an operation requires authentication.
 * @param operation - Operation object
 * @param spec - OpenAPI specification
 * @returns True if authentication is required
 */
export const requiresAuth = (operation, spec) => {
    const operationSecurity = operation.security;
    const globalSecurity = spec.security;
    const security = operationSecurity ?? globalSecurity;
    if (!security || security.length === 0)
        return false;
    if (security.some((s) => Object.keys(s).length === 0))
        return false;
    return true;
};
/**
 * Pipeline to parse and extract operations from a spec source.
 * @param source - Path, URL, or OpenAPI object
 * @returns Result containing operations or error
 */
export const parseAndExtractOperations = async (source) => {
    const specResult = await parseOpenApiSpec(source);
    if (specResult._tag === 'Err')
        return specResult;
    const validationResult = validateOpenApiVersion(specResult.value);
    if (validationResult._tag === 'Err')
        return validationResult;
    return ok(extractOperations(validationResult.value));
};
//# sourceMappingURL=parser.js.map