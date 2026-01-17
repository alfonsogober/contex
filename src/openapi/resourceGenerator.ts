/**
 * Generates MCP resources from OpenAPI schemas and operations.
 * Pure functions for creating resource definitions.
 * @module openapi/resourceGenerator
 */

import * as R from 'ramda';
import type { OpenApiSpec, JsonSchema, McpResource, Operation } from '../core/types.js';
import { extractSchemas, extractOperations } from './parser.js';
import { toCamelCase } from '../utils/fp.js';

/**
 * Creates a resource URI from a schema name.
 * @param schemaName - Name of the schema
 * @returns Resource URI
 */
export const schemaNameToUri = (schemaName: string): string =>
  `schema://${toCamelCase(schemaName)}`;

/**
 * Creates a resource URI from an operation.
 * @param operation - API operation
 * @returns Resource URI
 */
export const operationToUri = (operation: Operation): string => {
  const path = operation.path.replace(/\{[^}]+\}/g, '_');
  return `api://${operation.method}${path}`.replace(/\/+/g, '/');
};

/**
 * Determines the MIME type for a resource.
 * @param schema - JSON Schema
 * @returns MIME type string
 */
export const determineMimeType = (schema: JsonSchema): string => {
  if (schema.type === 'string' && schema.format === 'binary') {
    return 'application/octet-stream';
  }
  return 'application/json';
};

/**
 * Builds a description for a schema-based resource.
 * @param schemaName - Name of the schema
 * @param schema - JSON Schema definition
 * @returns Resource description
 */
export const buildSchemaDescription = (
  schemaName: string,
  schema: JsonSchema
): string => {
  if (schema.description) return schema.description;
  return `Schema definition for ${schemaName}`;
};

/**
 * Converts a single schema to an MCP resource.
 * @param schemaName - Name of the schema
 * @param schema - JSON Schema definition
 * @returns MCP resource definition
 */
export const schemaToResource = (
  schemaName: string,
  schema: JsonSchema
): McpResource => ({
  uri: schemaNameToUri(schemaName),
  name: schemaName,
  description: buildSchemaDescription(schemaName, schema),
  mimeType: determineMimeType(schema),
});

/**
 * Converts all schemas from an OpenAPI spec to resources.
 * @param spec - OpenAPI specification
 * @returns Array of MCP resources
 */
export const schemasToResources = (spec: OpenApiSpec): McpResource[] =>
  R.pipe(
    extractSchemas,
    R.toPairs,
    R.map(([name, schema]: [string, JsonSchema]) => schemaToResource(name, schema))
  )(spec);

/**
 * Checks if an operation is suitable for resource generation.
 * Only GET operations without required path parameters are considered.
 * @param operation - API operation
 * @returns True if suitable for resource
 */
export const isResourceableOperation = (operation: Operation): boolean => {
  if (operation.method !== 'get') return false;
  
  const requiredPathParams = (operation.parameters ?? []).filter(
    (p) => p.in === 'path' && p.required !== false
  );
  
  return requiredPathParams.length === 0;
};

/**
 * Builds a description for an operation-based resource.
 * @param operation - API operation
 * @returns Resource description
 */
export const buildOperationDescription = (operation: Operation): string => {
  const parts: string[] = [];
  
  if (operation.summary) parts.push(operation.summary);
  if (operation.description && operation.description !== operation.summary) {
    parts.push(operation.description);
  }
  
  return parts.join(' - ') || `GET ${operation.path}`;
};

/**
 * Converts a GET operation to an MCP resource.
 * @param operation - API operation (must be GET)
 * @returns MCP resource definition
 */
export const operationToResource = (operation: Operation): McpResource => ({
  uri: operationToUri(operation),
  name: operation.operationId ?? `get_${operation.path.replace(/\//g, '_')}`,
  description: buildOperationDescription(operation),
  mimeType: 'application/json',
});

/**
 * Converts suitable operations from a spec to resources.
 * @param spec - OpenAPI specification
 * @returns Array of MCP resources
 */
export const operationsToResources = (spec: OpenApiSpec): McpResource[] =>
  R.pipe(
    extractOperations,
    R.filter(isResourceableOperation),
    R.map(operationToResource)
  )(spec);

/**
 * Combines schema and operation resources from a spec.
 * @param spec - OpenAPI specification
 * @returns All MCP resources
 */
export const extractAllResources = (spec: OpenApiSpec): McpResource[] => [
  ...schemasToResources(spec),
  ...operationsToResources(spec),
];

/**
 * Filters resources by a predicate.
 * @param predicate - Filter function
 * @returns A function that filters resources
 */
export const filterResources =
  (predicate: (resource: McpResource) => boolean) =>
  (resources: McpResource[]): McpResource[] =>
    R.filter(predicate, resources);

/**
 * Filters resources by URI prefix.
 * @param prefix - URI prefix to match
 * @returns A function that filters resources
 */
export const filterByUriPrefix =
  (prefix: string) =>
  (resources: McpResource[]): McpResource[] =>
    filterResources((r) => r.uri.startsWith(prefix))(resources);

/**
 * Groups resources by their URI scheme.
 * @param resources - Array of resources
 * @returns Resources grouped by scheme
 */
export const groupByScheme = (
  resources: McpResource[]
): Record<string, McpResource[]> =>
  R.groupBy((r) => {
    const match = r.uri.match(/^([a-z]+):\/\//);
    return match?.[1] ?? 'unknown';
  }, resources) as Record<string, McpResource[]>;

/**
 * Creates a resource template for parameterized resources.
 * @param operation - API operation with path parameters
 * @returns Resource template definition
 */
export const createResourceTemplate = (operation: Operation): {
  uriTemplate: string;
  name: string;
  description: string;
  parameters: Array<{ name: string; description?: string; required: boolean }>;
} => {
  const pathParams = (operation.parameters ?? []).filter((p) => p.in === 'path');
  
  const uriTemplate = `api://${operation.method}${operation.path}`;
  
  return {
    uriTemplate,
    name: operation.operationId ?? `get_${operation.path.replace(/\//g, '_')}`,
    description: buildOperationDescription(operation),
    parameters: pathParams.map((p) => ({
      name: p.name,
      description: p.description,
      required: p.required ?? true,
    })),
  };
};

/**
 * Validates that resource URIs are unique.
 * @param resources - Array of resources
 * @returns True if all URIs are unique
 */
export const hasUniqueUris = (resources: McpResource[]): boolean => {
  const uris = resources.map((r) => r.uri);
  return new Set(uris).size === uris.length;
};

/**
 * Resolves duplicate resource URIs by appending counter.
 * @param resources - Array of resources
 * @returns Resources with unique URIs
 */
export const resolveUriConflicts = (resources: McpResource[]): McpResource[] => {
  const uriCount = new Map<string, number>();
  
  return resources.map((resource) => {
    const baseUri = resource.uri;
    const count = uriCount.get(baseUri) ?? 0;
    uriCount.set(baseUri, count + 1);
    
    if (count === 0) return resource;
    
    return {
      ...resource,
      uri: `${baseUri}#${count}`,
    };
  });
};

/**
 * Pipeline to extract and process resources from a spec.
 * @param spec - OpenAPI specification
 * @returns Processed array of unique resources
 */
export const buildResourcesPipeline = R.pipe(
  extractAllResources,
  resolveUriConflicts
);
