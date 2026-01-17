/**
 * OpenAPI specification parser.
 * Provides pure functions for parsing and extracting data from OpenAPI specs.
 * @module openapi/parser
 */
import { Result } from '../core/result.js';
import { type ParseError } from '../core/errors.js';
import type { OpenApiSpec, Operation, HttpMethod, OpenApiParameter, JsonSchema } from '../core/types.js';
/**
 * Validates if a string is a valid HTTP method.
 * @param method - String to validate
 * @returns True if valid HTTP method
 */
export declare const isHttpMethod: (method: string) => method is HttpMethod;
/**
 * Parses an OpenAPI specification from a file path, URL, or object.
 * @param spec - Path, URL, or OpenAPI object
 * @returns Result containing parsed spec or error
 */
export declare const parseOpenApiSpec: (spec: string | object) => Promise<Result<OpenApiSpec, ParseError>>;
/**
 * Validates that the spec is a supported OpenAPI version.
 * @param spec - Parsed OpenAPI specification
 * @returns Result containing spec or error
 */
export declare const validateOpenApiVersion: (spec: OpenApiSpec) => Result<OpenApiSpec, ParseError>;
/**
 * Extracts all operations from an OpenAPI specification.
 * Pure function that transforms spec into array of operations.
 * @param spec - Parsed OpenAPI specification
 * @returns Array of all operations
 */
export declare const extractOperations: (spec: OpenApiSpec) => Operation[];
/**
 * Filters operations by tag.
 * @param tag - Tag to filter by
 * @returns A function that filters operations
 */
export declare const filterByTag: (tag: string) => (operations: Operation[]) => Operation[];
/**
 * Filters out deprecated operations.
 * @param operations - Array of operations
 * @returns Non-deprecated operations
 */
export declare const filterNonDeprecated: (operations: Operation[]) => Operation[];
/**
 * Groups operations by their first tag.
 * @param operations - Array of operations
 * @returns Operations grouped by tag
 */
export declare const groupByTag: (operations: Operation[]) => Record<string, Operation[]>;
/**
 * Generates an operation ID from method and path if not provided.
 * @param operation - Operation object
 * @returns Operation ID
 */
export declare const getOperationId: (operation: Operation) => string;
/**
 * Extracts all parameter names from an operation.
 * @param operation - Operation object
 * @returns Array of parameter names
 */
export declare const getParameterNames: (operation: Operation) => string[];
/**
 * Extracts path parameters from an operation.
 * @param operation - Operation object
 * @returns Array of path parameters
 */
export declare const getPathParameters: (operation: Operation) => OpenApiParameter[];
/**
 * Extracts query parameters from an operation.
 * @param operation - Operation object
 * @returns Array of query parameters
 */
export declare const getQueryParameters: (operation: Operation) => OpenApiParameter[];
/**
 * Extracts header parameters from an operation.
 * @param operation - Operation object
 * @returns Array of header parameters
 */
export declare const getHeaderParameters: (operation: Operation) => OpenApiParameter[];
/**
 * Extracts the request body schema from an operation.
 * @param operation - Operation object
 * @returns Request body schema or undefined
 */
export declare const getRequestBodySchema: (operation: Operation) => JsonSchema | undefined;
/**
 * Extracts the success response schema from an operation.
 * Looks for 200, 201, or 2xx responses.
 * @param operation - Operation object
 * @returns Success response schema or undefined
 */
export declare const getSuccessResponseSchema: (operation: Operation) => JsonSchema | undefined;
/**
 * Extracts all schemas from the components section.
 * @param spec - OpenAPI specification
 * @returns Record of schema name to schema
 */
export declare const extractSchemas: (spec: OpenApiSpec) => Record<string, JsonSchema>;
/**
 * Extracts security schemes from the components section.
 * @param spec - OpenAPI specification
 * @returns Record of security scheme name to scheme
 */
export declare const extractSecuritySchemes: (spec: OpenApiSpec) => Record<string, import("../core/types.js").SecurityScheme>;
/**
 * Gets the base URL from the spec's servers array.
 * @param spec - OpenAPI specification
 * @returns Base URL or empty string
 */
export declare const getBaseUrl: (spec: OpenApiSpec) => string;
/**
 * Checks if an operation requires authentication.
 * @param operation - Operation object
 * @param spec - OpenAPI specification
 * @returns True if authentication is required
 */
export declare const requiresAuth: (operation: Operation, spec: OpenApiSpec) => boolean;
/**
 * Pipeline to parse and extract operations from a spec source.
 * @param source - Path, URL, or OpenAPI object
 * @returns Result containing operations or error
 */
export declare const parseAndExtractOperations: (source: string | object) => Promise<Result<Operation[], ParseError>>;
//# sourceMappingURL=parser.d.ts.map