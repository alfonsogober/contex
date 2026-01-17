/**
 * OpenAPI specification parser.
 * Provides pure functions for parsing and extracting data from OpenAPI specs.
 * @module openapi/parser
 */

import * as R from 'ramda';
import SwaggerParser from '@apidevtools/swagger-parser';
import { Result, ok, err, tryCatchAsync } from '../core/result.js';
import { parseError, type ParseError } from '../core/errors.js';
import type {
  OpenApiSpec,
  Operation,
  HttpMethod,
  OpenApiParameter,
  OpenApiRequestBody,
  OpenApiResponse,
  SecurityRequirement,
  JsonSchema,
} from '../core/types.js';
import { isObject, compact } from '../utils/fp.js';

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

/**
 * Validates if a string is a valid HTTP method.
 * @param method - String to validate
 * @returns True if valid HTTP method
 */
export const isHttpMethod = (method: string): method is HttpMethod =>
  HTTP_METHODS.includes(method as HttpMethod);

/**
 * Parses an OpenAPI specification from a file path, URL, or object.
 * @param spec - Path, URL, or OpenAPI object
 * @returns Result containing parsed spec or error
 */
export const parseOpenApiSpec = async (
  spec: string | object
): Promise<Result<OpenApiSpec, ParseError>> =>
  tryCatchAsync(
    async () => {
      const parsed = await SwaggerParser.dereference(spec as string);
      return parsed as unknown as OpenApiSpec;
    },
    (e) =>
      parseError(
        e instanceof Error ? e.message : 'Failed to parse OpenAPI spec',
        typeof spec === 'string' ? spec : 'inline object',
        e
      )
  );

/**
 * Validates that the spec is a supported OpenAPI version.
 * @param spec - Parsed OpenAPI specification
 * @returns Result containing spec or error
 */
export const validateOpenApiVersion = (
  spec: OpenApiSpec
): Result<OpenApiSpec, ParseError> => {
  const version = spec.openapi;
  if (!version || !version.startsWith('3.')) {
    return err(
      parseError(
        `Unsupported OpenAPI version: ${version}. Only 3.x is supported.`,
        'openapi version'
      )
    );
  }
  return ok(spec);
};

/**
 * Extracts the operation object from a path item.
 * @param pathItem - Path item object
 * @param method - HTTP method
 * @returns Operation data or undefined
 */
const extractOperationFromPathItem = (
  pathItem: Record<string, unknown>,
  method: HttpMethod
): Record<string, unknown> | undefined => {
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
const buildOperation = (
  method: HttpMethod,
  path: string,
  rawOperation: Record<string, unknown>
): Operation => ({
  operationId: rawOperation.operationId as string | undefined,
  method,
  path,
  summary: rawOperation.summary as string | undefined,
  description: rawOperation.description as string | undefined,
  parameters: rawOperation.parameters as OpenApiParameter[] | undefined,
  requestBody: rawOperation.requestBody as OpenApiRequestBody | undefined,
  responses: rawOperation.responses as Record<string, OpenApiResponse> | undefined,
  security: rawOperation.security as SecurityRequirement[] | undefined,
  tags: rawOperation.tags as string[] | undefined,
  deprecated: rawOperation.deprecated as boolean | undefined,
});

/**
 * Extracts all operations from an OpenAPI path item.
 * @param path - URL path
 * @param pathItem - Path item object
 * @returns Array of operations
 */
const extractOperationsFromPath = (
  path: string,
  pathItem: Record<string, unknown>
): Operation[] =>
  R.pipe(
    R.filter(isHttpMethod),
    R.map((method: HttpMethod) => {
      const rawOp = extractOperationFromPathItem(pathItem, method);
      return rawOp ? buildOperation(method, path, rawOp) : undefined;
    }),
    compact
  )(HTTP_METHODS);

/**
 * Extracts all operations from an OpenAPI specification.
 * Pure function that transforms spec into array of operations.
 * @param spec - Parsed OpenAPI specification
 * @returns Array of all operations
 */
export const extractOperations = (spec: OpenApiSpec): Operation[] =>
  R.pipe(
    R.toPairs,
    R.chain(([path, pathItem]: [string, unknown]) =>
      isObject(pathItem) ? extractOperationsFromPath(path, pathItem) : []
    )
  )(spec.paths);

/**
 * Filters operations by tag.
 * @param tag - Tag to filter by
 * @returns A function that filters operations
 */
export const filterByTag =
  (tag: string) =>
  (operations: Operation[]): Operation[] =>
    R.filter((op) => op.tags?.includes(tag) ?? false, operations);

/**
 * Filters out deprecated operations.
 * @param operations - Array of operations
 * @returns Non-deprecated operations
 */
export const filterNonDeprecated = (operations: Operation[]): Operation[] =>
  R.filter((op) => !op.deprecated, operations);

/**
 * Groups operations by their first tag.
 * @param operations - Array of operations
 * @returns Operations grouped by tag
 */
export const groupByTag = (operations: Operation[]): Record<string, Operation[]> =>
  R.groupBy((op) => op.tags?.[0] ?? 'default', operations) as Record<string, Operation[]>;

/**
 * Generates an operation ID from method and path if not provided.
 * @param operation - Operation object
 * @returns Operation ID
 */
export const getOperationId = (operation: Operation): string => {
  if (operation.operationId) return operation.operationId;
  
  const pathParts = operation.path
    .split('/')
    .filter(Boolean)
    .map((part) =>
      part.startsWith('{') ? `By${part.slice(1, -1)}` : part
    );
  
  return `${operation.method}_${pathParts.join('_')}`;
};

/**
 * Extracts all parameter names from an operation.
 * @param operation - Operation object
 * @returns Array of parameter names
 */
export const getParameterNames = (operation: Operation): string[] =>
  (operation.parameters ?? []).map((p) => p.name);

/**
 * Extracts path parameters from an operation.
 * @param operation - Operation object
 * @returns Array of path parameters
 */
export const getPathParameters = (operation: Operation): OpenApiParameter[] =>
  (operation.parameters ?? []).filter((p) => p.in === 'path');

/**
 * Extracts query parameters from an operation.
 * @param operation - Operation object
 * @returns Array of query parameters
 */
export const getQueryParameters = (operation: Operation): OpenApiParameter[] =>
  (operation.parameters ?? []).filter((p) => p.in === 'query');

/**
 * Extracts header parameters from an operation.
 * @param operation - Operation object
 * @returns Array of header parameters
 */
export const getHeaderParameters = (operation: Operation): OpenApiParameter[] =>
  (operation.parameters ?? []).filter((p) => p.in === 'header');

/**
 * Extracts the request body schema from an operation.
 * @param operation - Operation object
 * @returns Request body schema or undefined
 */
export const getRequestBodySchema = (operation: Operation): JsonSchema | undefined => {
  const content = operation.requestBody?.content;
  if (!content) return undefined;
  
  const jsonContent = content['application/json'];
  return jsonContent?.schema;
};

/**
 * Extracts the success response schema from an operation.
 * Looks for 200, 201, or 2xx responses.
 * @param operation - Operation object
 * @returns Success response schema or undefined
 */
export const getSuccessResponseSchema = (operation: Operation): JsonSchema | undefined => {
  const responses = operation.responses;
  if (!responses) return undefined;
  
  const successResponse = responses['200'] ?? responses['201'] ?? responses['2XX'];
  const content = successResponse?.content;
  if (!content) return undefined;
  
  const jsonContent = content['application/json'];
  return jsonContent?.schema;
};

/**
 * Extracts all schemas from the components section.
 * @param spec - OpenAPI specification
 * @returns Record of schema name to schema
 */
export const extractSchemas = (spec: OpenApiSpec): Record<string, JsonSchema> =>
  spec.components?.schemas ?? {};

/**
 * Extracts security schemes from the components section.
 * @param spec - OpenAPI specification
 * @returns Record of security scheme name to scheme
 */
export const extractSecuritySchemes = (spec: OpenApiSpec) =>
  spec.components?.securitySchemes ?? {};

/**
 * Gets the base URL from the spec's servers array.
 * @param spec - OpenAPI specification
 * @returns Base URL or empty string
 */
export const getBaseUrl = (spec: OpenApiSpec): string =>
  spec.servers?.[0]?.url ?? '';

/**
 * Checks if an operation requires authentication.
 * @param operation - Operation object
 * @param spec - OpenAPI specification
 * @returns True if authentication is required
 */
export const requiresAuth = (operation: Operation, spec: OpenApiSpec): boolean => {
  const operationSecurity = operation.security;
  const globalSecurity = spec.security;
  
  const security = operationSecurity ?? globalSecurity;
  
  if (!security || security.length === 0) return false;
  if (security.some((s) => Object.keys(s).length === 0)) return false;
  
  return true;
};

/**
 * Pipeline to parse and extract operations from a spec source.
 * @param source - Path, URL, or OpenAPI object
 * @returns Result containing operations or error
 */
export const parseAndExtractOperations = async (
  source: string | object
): Promise<Result<Operation[], ParseError>> => {
  const specResult = await parseOpenApiSpec(source);
  
  if (specResult._tag === 'Err') return specResult;
  
  const validationResult = validateOpenApiVersion(specResult.value);
  
  if (validationResult._tag === 'Err') return validationResult;
  
  return ok(extractOperations(validationResult.value));
};
