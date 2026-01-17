/**
 * Converts OpenAPI/JSON Schema to Zod schemas.
 * Pure functions for schema transformation.
 * @module openapi/schemaConverter
 */
import { z, type ZodSchema, type ZodTypeAny } from 'zod';
import type { JsonSchema, SchemaMeta } from '../core/types.js';
/**
 * Converts a JSON Schema type to the corresponding Zod schema.
 * @param schema - JSON Schema definition
 * @returns Zod schema
 */
export declare const jsonSchemaTypeToZod: (schema: JsonSchema) => ZodTypeAny;
/**
 * Adds nullable modifier if schema allows null.
 * @param zodSchema - Zod schema to modify
 * @param jsonSchema - Original JSON Schema
 * @returns Nullable schema if needed
 */
export declare const applyNullable: (zodSchema: ZodTypeAny, jsonSchema: JsonSchema) => ZodTypeAny;
/**
 * Adds description to schema.
 * @param zodSchema - Zod schema to modify
 * @param description - Description text
 * @returns Schema with description
 */
export declare const applyDescription: (zodSchema: ZodTypeAny, description: string | undefined) => ZodTypeAny;
/**
 * Adds default value to schema.
 * @param zodSchema - Zod schema to modify
 * @param defaultValue - Default value
 * @returns Schema with default
 */
export declare const applyDefault: (zodSchema: ZodTypeAny, defaultValue: unknown) => ZodTypeAny;
/**
 * Converts a JSON Schema to Zod with all modifiers applied.
 * @param schema - JSON Schema definition
 * @returns Complete Zod schema
 */
export declare const jsonSchemaToZod: (schema: JsonSchema) => ZodTypeAny;
/**
 * Converts a JSON Schema to Zod with metadata.
 * @param schema - JSON Schema definition
 * @param meta - Additional metadata
 * @returns Zod schema with metadata applied
 */
export declare const jsonSchemaToZodWithMeta: (schema: JsonSchema, meta: SchemaMeta) => ZodTypeAny;
/**
 * Builds a combined input schema from parameters and request body.
 * @param parameters - Array of parameter schemas with names
 * @param requestBodySchema - Optional request body schema
 * @returns Combined Zod object schema
 */
export declare const buildInputSchema: (parameters: Array<{
    name: string;
    schema: JsonSchema;
    required?: boolean;
}>, requestBodySchema?: JsonSchema) => ZodTypeAny;
/**
 * Validates an input against a Zod schema.
 * @param schema - Zod schema to validate against
 * @param input - Input to validate
 * @returns Validation result
 */
export declare const validateInput: <T>(schema: ZodSchema<T>, input: unknown) => {
    success: true;
    data: T;
} | {
    success: false;
    errors: z.ZodError;
};
//# sourceMappingURL=schemaConverter.d.ts.map