/**
 * Generates MCP resources from OpenAPI schemas and operations.
 * Pure functions for creating resource definitions.
 * @module openapi/resourceGenerator
 */
import type { OpenApiSpec, JsonSchema, McpResource, Operation } from '../core/types.js';
/**
 * Creates a resource URI from a schema name.
 * @param schemaName - Name of the schema
 * @returns Resource URI
 */
export declare const schemaNameToUri: (schemaName: string) => string;
/**
 * Creates a resource URI from an operation.
 * @param operation - API operation
 * @returns Resource URI
 */
export declare const operationToUri: (operation: Operation) => string;
/**
 * Determines the MIME type for a resource.
 * @param schema - JSON Schema
 * @returns MIME type string
 */
export declare const determineMimeType: (schema: JsonSchema) => string;
/**
 * Builds a description for a schema-based resource.
 * @param schemaName - Name of the schema
 * @param schema - JSON Schema definition
 * @returns Resource description
 */
export declare const buildSchemaDescription: (schemaName: string, schema: JsonSchema) => string;
/**
 * Converts a single schema to an MCP resource.
 * @param schemaName - Name of the schema
 * @param schema - JSON Schema definition
 * @returns MCP resource definition
 */
export declare const schemaToResource: (schemaName: string, schema: JsonSchema) => McpResource;
/**
 * Converts all schemas from an OpenAPI spec to resources.
 * @param spec - OpenAPI specification
 * @returns Array of MCP resources
 */
export declare const schemasToResources: (spec: OpenApiSpec) => McpResource[];
/**
 * Checks if an operation is suitable for resource generation.
 * Only GET operations without required path parameters are considered.
 * @param operation - API operation
 * @returns True if suitable for resource
 */
export declare const isResourceableOperation: (operation: Operation) => boolean;
/**
 * Builds a description for an operation-based resource.
 * @param operation - API operation
 * @returns Resource description
 */
export declare const buildOperationDescription: (operation: Operation) => string;
/**
 * Converts a GET operation to an MCP resource.
 * @param operation - API operation (must be GET)
 * @returns MCP resource definition
 */
export declare const operationToResource: (operation: Operation) => McpResource;
/**
 * Converts suitable operations from a spec to resources.
 * @param spec - OpenAPI specification
 * @returns Array of MCP resources
 */
export declare const operationsToResources: (spec: OpenApiSpec) => McpResource[];
/**
 * Combines schema and operation resources from a spec.
 * @param spec - OpenAPI specification
 * @returns All MCP resources
 */
export declare const extractAllResources: (spec: OpenApiSpec) => McpResource[];
/**
 * Filters resources by a predicate.
 * @param predicate - Filter function
 * @returns A function that filters resources
 */
export declare const filterResources: (predicate: (resource: McpResource) => boolean) => (resources: McpResource[]) => McpResource[];
/**
 * Filters resources by URI prefix.
 * @param prefix - URI prefix to match
 * @returns A function that filters resources
 */
export declare const filterByUriPrefix: (prefix: string) => (resources: McpResource[]) => McpResource[];
/**
 * Groups resources by their URI scheme.
 * @param resources - Array of resources
 * @returns Resources grouped by scheme
 */
export declare const groupByScheme: (resources: McpResource[]) => Record<string, McpResource[]>;
/**
 * Creates a resource template for parameterized resources.
 * @param operation - API operation with path parameters
 * @returns Resource template definition
 */
export declare const createResourceTemplate: (operation: Operation) => {
    uriTemplate: string;
    name: string;
    description: string;
    parameters: Array<{
        name: string;
        description?: string;
        required: boolean;
    }>;
};
/**
 * Validates that resource URIs are unique.
 * @param resources - Array of resources
 * @returns True if all URIs are unique
 */
export declare const hasUniqueUris: (resources: McpResource[]) => boolean;
/**
 * Resolves duplicate resource URIs by appending counter.
 * @param resources - Array of resources
 * @returns Resources with unique URIs
 */
export declare const resolveUriConflicts: (resources: McpResource[]) => McpResource[];
/**
 * Pipeline to extract and process resources from a spec.
 * @param spec - OpenAPI specification
 * @returns Processed array of unique resources
 */
export declare const buildResourcesPipeline: (spec: OpenApiSpec) => McpResource[];
//# sourceMappingURL=resourceGenerator.d.ts.map