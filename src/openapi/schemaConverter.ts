/**
 * Converts OpenAPI/JSON Schema to Zod schemas.
 * Pure functions for schema transformation.
 * @module openapi/schemaConverter
 */

import * as R from 'ramda';
import { z, type ZodSchema, type ZodTypeAny } from 'zod';
import type { JsonSchema, SchemaMeta } from '../core/types.js';
import { isObject, isArray, isDefined } from '../utils/fp.js';

/**
 * Converts a JSON Schema type to the corresponding Zod schema.
 * @param schema - JSON Schema definition
 * @returns Zod schema
 */
export const jsonSchemaTypeToZod = (schema: JsonSchema): ZodTypeAny => {
  if (schema.$ref) {
    return z.any();
  }

  if (schema.allOf) {
    return handleAllOf(schema.allOf);
  }

  if (schema.anyOf) {
    return handleAnyOf(schema.anyOf);
  }

  if (schema.oneOf) {
    return handleOneOf(schema.oneOf);
  }

  if (schema.enum) {
    return handleEnum(schema.enum);
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  switch (type) {
    case 'string':
      return buildStringSchema(schema);
    case 'number':
    case 'integer':
      return buildNumberSchema(schema, type);
    case 'boolean':
      return z.boolean();
    case 'array':
      return buildArraySchema(schema);
    case 'object':
      return buildObjectSchema(schema);
    case 'null':
      return z.null();
    default:
      return z.any();
  }
};

/**
 * Builds a Zod string schema with constraints.
 * @param schema - JSON Schema with string type
 * @returns Zod string schema
 */
const buildStringSchema = (schema: JsonSchema): ZodTypeAny => {
  let zodSchema = z.string();

  if (isDefined(schema.minLength)) {
    zodSchema = zodSchema.min(schema.minLength);
  }

  if (isDefined(schema.maxLength)) {
    zodSchema = zodSchema.max(schema.maxLength);
  }

  if (isDefined(schema.pattern)) {
    zodSchema = zodSchema.regex(new RegExp(schema.pattern));
  }

  if (schema.format) {
    zodSchema = applyStringFormat(zodSchema, schema.format);
  }

  return zodSchema;
};

/**
 * Applies format validation to a string schema.
 * @param schema - Zod string schema
 * @param format - OpenAPI format
 * @returns Enhanced Zod string schema
 */
const applyStringFormat = (schema: z.ZodString, format: string): z.ZodString => {
  switch (format) {
    case 'email':
      return schema.email();
    case 'uri':
    case 'url':
      return schema.url();
    case 'uuid':
      return schema.uuid();
    case 'date':
      return schema.date();
    case 'date-time':
      return schema.datetime();
    case 'ipv4':
      return schema.ip({ version: 'v4' });
    case 'ipv6':
      return schema.ip({ version: 'v6' });
    default:
      return schema;
  }
};

/**
 * Builds a Zod number schema with constraints.
 * @param schema - JSON Schema with number/integer type
 * @param type - 'number' or 'integer'
 * @returns Zod number schema
 */
const buildNumberSchema = (
  schema: JsonSchema,
  type: 'number' | 'integer'
): ZodTypeAny => {
  let zodSchema = type === 'integer' ? z.number().int() : z.number();

  if (isDefined(schema.minimum)) {
    zodSchema = zodSchema.min(schema.minimum);
  }

  if (isDefined(schema.maximum)) {
    zodSchema = zodSchema.max(schema.maximum);
  }

  return zodSchema;
};

/**
 * Builds a Zod array schema.
 * @param schema - JSON Schema with array type
 * @returns Zod array schema
 */
const buildArraySchema = (schema: JsonSchema): ZodTypeAny => {
  const itemSchema = schema.items ? jsonSchemaTypeToZod(schema.items) : z.any();
  return z.array(itemSchema);
};

/**
 * Builds a Zod object schema.
 * @param schema - JSON Schema with object type
 * @returns Zod object schema
 */
const buildObjectSchema = (schema: JsonSchema): ZodTypeAny => {
  if (!schema.properties) {
    if (schema.additionalProperties === true) {
      return z.record(z.any());
    }
    if (isObject(schema.additionalProperties)) {
      return z.record(jsonSchemaTypeToZod(schema.additionalProperties as JsonSchema));
    }
    return z.object({});
  }

  const required = new Set(schema.required ?? []);
  
  const shape: Record<string, ZodTypeAny> = R.mapObjIndexed(
    (propSchema: JsonSchema, propName: string) => {
      const zodProp = jsonSchemaTypeToZod(propSchema);
      return required.has(propName) ? zodProp : zodProp.optional();
    },
    schema.properties
  );

  let objectSchema = z.object(shape);

  if (schema.additionalProperties === true) {
    return objectSchema.passthrough();
  } else if (schema.additionalProperties === false) {
    return objectSchema.strict();
  }

  return objectSchema;
};

/**
 * Handles allOf composition.
 * @param schemas - Array of schemas to merge
 * @returns Zod intersection schema
 */
const handleAllOf = (schemas: JsonSchema[]): ZodTypeAny => {
  if (schemas.length === 0) return z.any();
  if (schemas.length === 1) return jsonSchemaTypeToZod(schemas[0]);
  
  return schemas.slice(1).reduce(
    (acc, schema) => z.intersection(acc, jsonSchemaTypeToZod(schema)),
    jsonSchemaTypeToZod(schemas[0])
  );
};

/**
 * Handles anyOf composition.
 * @param schemas - Array of possible schemas
 * @returns Zod union schema
 */
const handleAnyOf = (schemas: JsonSchema[]): ZodTypeAny => {
  if (schemas.length === 0) return z.any();
  if (schemas.length === 1) return jsonSchemaTypeToZod(schemas[0]);
  
  const zodSchemas = schemas.map(jsonSchemaTypeToZod) as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]];
  return z.union(zodSchemas);
};

/**
 * Handles oneOf composition (same as anyOf in Zod).
 * @param schemas - Array of possible schemas
 * @returns Zod union schema
 */
const handleOneOf = (schemas: JsonSchema[]): ZodTypeAny => handleAnyOf(schemas);

/**
 * Handles enum values.
 * @param values - Enum values
 * @returns Zod enum or literal union schema
 */
const handleEnum = (values: unknown[]): ZodTypeAny => {
  if (values.length === 0) return z.never();
  
  const stringValues = values.filter((v): v is string => typeof v === 'string');
  
  if (stringValues.length === values.length && stringValues.length > 0) {
    return z.enum(stringValues as [string, ...string[]]);
  }
  
  const literals = values.map((v) => z.literal(v as z.Primitive));
  if (literals.length === 1) return literals[0];
  if (literals.length === 2) return z.union([literals[0], literals[1]]);
  
  return z.union([literals[0], literals[1], ...literals.slice(2)]);
};

/**
 * Adds nullable modifier if schema allows null.
 * @param zodSchema - Zod schema to modify
 * @param jsonSchema - Original JSON Schema
 * @returns Nullable schema if needed
 */
export const applyNullable = (
  zodSchema: ZodTypeAny,
  jsonSchema: JsonSchema
): ZodTypeAny => {
  if (jsonSchema.nullable) {
    return zodSchema.nullable();
  }
  
  if (isArray(jsonSchema.type) && jsonSchema.type.includes('null')) {
    return zodSchema.nullable();
  }
  
  return zodSchema;
};

/**
 * Adds description to schema.
 * @param zodSchema - Zod schema to modify
 * @param description - Description text
 * @returns Schema with description
 */
export const applyDescription = (
  zodSchema: ZodTypeAny,
  description: string | undefined
): ZodTypeAny =>
  description ? zodSchema.describe(description) : zodSchema;

/**
 * Adds default value to schema.
 * @param zodSchema - Zod schema to modify
 * @param defaultValue - Default value
 * @returns Schema with default
 */
export const applyDefault = (
  zodSchema: ZodTypeAny,
  defaultValue: unknown
): ZodTypeAny =>
  isDefined(defaultValue) ? zodSchema.default(defaultValue) : zodSchema;

/**
 * Converts a JSON Schema to Zod with all modifiers applied.
 * @param schema - JSON Schema definition
 * @returns Complete Zod schema
 */
export const jsonSchemaToZod = (schema: JsonSchema): ZodTypeAny =>
  R.pipe(
    () => jsonSchemaTypeToZod(schema),
    (zod) => applyNullable(zod, schema),
    (zod) => applyDescription(zod, schema.description),
    (zod) => applyDefault(zod, schema.default)
  )();

/**
 * Converts a JSON Schema to Zod with metadata.
 * @param schema - JSON Schema definition
 * @param meta - Additional metadata
 * @returns Zod schema with metadata applied
 */
export const jsonSchemaToZodWithMeta = (
  schema: JsonSchema,
  meta: SchemaMeta
): ZodTypeAny => {
  const baseSchema = jsonSchemaToZod(schema);
  return applyDescription(baseSchema, meta.description ?? schema.description);
};

/**
 * Builds a combined input schema from parameters and request body.
 * @param parameters - Array of parameter schemas with names
 * @param requestBodySchema - Optional request body schema
 * @returns Combined Zod object schema
 */
export const buildInputSchema = (
  parameters: Array<{ name: string; schema: JsonSchema; required?: boolean }>,
  requestBodySchema?: JsonSchema
): ZodTypeAny => {
  const paramShapes: Record<string, ZodTypeAny> = {};
  
  for (const param of parameters) {
    const zodParam = jsonSchemaToZod(param.schema);
    paramShapes[param.name] = param.required ? zodParam : zodParam.optional();
  }
  
  if (requestBodySchema) {
    const bodyZod = jsonSchemaToZod(requestBodySchema);
    paramShapes['body'] = bodyZod;
  }
  
  return z.object(paramShapes);
};

/**
 * Validates an input against a Zod schema.
 * @param schema - Zod schema to validate against
 * @param input - Input to validate
 * @returns Validation result
 */
export const validateInput = <T>(
  schema: ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
};
