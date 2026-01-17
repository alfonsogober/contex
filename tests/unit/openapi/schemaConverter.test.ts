import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  jsonSchemaToZod,
  jsonSchemaTypeToZod,
  buildInputSchema,
  validateInput,
  applyNullable,
  applyDescription,
  applyDefault,
} from '../../../src/openapi/schemaConverter.js';

describe('schemaConverter', () => {
  describe('jsonSchemaTypeToZod', () => {
    it('converts string type', () => {
      const schema = jsonSchemaTypeToZod({ type: 'string' });
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
    });

    it('converts string with minLength', () => {
      const schema = jsonSchemaTypeToZod({ type: 'string', minLength: 3 });
      expect(schema.safeParse('ab').success).toBe(false);
      expect(schema.safeParse('abc').success).toBe(true);
    });

    it('converts string with maxLength', () => {
      const schema = jsonSchemaTypeToZod({ type: 'string', maxLength: 5 });
      expect(schema.safeParse('abcdef').success).toBe(false);
      expect(schema.safeParse('abcde').success).toBe(true);
    });

    it('converts string with pattern', () => {
      const schema = jsonSchemaTypeToZod({ type: 'string', pattern: '^[a-z]+$' });
      expect(schema.safeParse('abc').success).toBe(true);
      expect(schema.safeParse('ABC').success).toBe(false);
    });

    it('converts string with email format', () => {
      const schema = jsonSchemaTypeToZod({ type: 'string', format: 'email' });
      expect(schema.safeParse('test@example.com').success).toBe(true);
      expect(schema.safeParse('not-an-email').success).toBe(false);
    });

    it('converts string with uri format', () => {
      const schema = jsonSchemaTypeToZod({ type: 'string', format: 'uri' });
      expect(schema.safeParse('https://example.com').success).toBe(true);
      expect(schema.safeParse('not-a-url').success).toBe(false);
    });

    it('converts number type', () => {
      const schema = jsonSchemaTypeToZod({ type: 'number' });
      expect(schema.safeParse(3.14).success).toBe(true);
      expect(schema.safeParse('3.14').success).toBe(false);
    });

    it('converts integer type', () => {
      const schema = jsonSchemaTypeToZod({ type: 'integer' });
      expect(schema.safeParse(42).success).toBe(true);
      expect(schema.safeParse(3.14).success).toBe(false);
    });

    it('converts number with minimum', () => {
      const schema = jsonSchemaTypeToZod({ type: 'number', minimum: 0 });
      expect(schema.safeParse(-1).success).toBe(false);
      expect(schema.safeParse(0).success).toBe(true);
    });

    it('converts number with maximum', () => {
      const schema = jsonSchemaTypeToZod({ type: 'number', maximum: 100 });
      expect(schema.safeParse(101).success).toBe(false);
      expect(schema.safeParse(100).success).toBe(true);
    });

    it('converts boolean type', () => {
      const schema = jsonSchemaTypeToZod({ type: 'boolean' });
      expect(schema.safeParse(true).success).toBe(true);
      expect(schema.safeParse('true').success).toBe(false);
    });

    it('converts array type', () => {
      const schema = jsonSchemaTypeToZod({
        type: 'array',
        items: { type: 'string' },
      });
      expect(schema.safeParse(['a', 'b']).success).toBe(true);
      expect(schema.safeParse([1, 2]).success).toBe(false);
    });

    it('converts object type with properties', () => {
      const schema = jsonSchemaTypeToZod({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
        },
        required: ['name'],
      });
      
      expect(schema.safeParse({ name: 'John' }).success).toBe(true);
      expect(schema.safeParse({ name: 'John', age: 30 }).success).toBe(true);
      expect(schema.safeParse({ age: 30 }).success).toBe(false);
    });

    it('converts null type', () => {
      const schema = jsonSchemaTypeToZod({ type: 'null' });
      expect(schema.safeParse(null).success).toBe(true);
      expect(schema.safeParse(undefined).success).toBe(false);
    });

    it('converts enum', () => {
      const schema = jsonSchemaTypeToZod({ enum: ['red', 'green', 'blue'] });
      expect(schema.safeParse('red').success).toBe(true);
      expect(schema.safeParse('yellow').success).toBe(false);
    });

    it('handles anyOf', () => {
      const schema = jsonSchemaTypeToZod({
        anyOf: [{ type: 'string' }, { type: 'number' }],
      });
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(42).success).toBe(true);
      expect(schema.safeParse(true).success).toBe(false);
    });

    it('handles allOf', () => {
      const schema = jsonSchemaTypeToZod({
        allOf: [
          { type: 'object', properties: { a: { type: 'string' } } },
          { type: 'object', properties: { b: { type: 'number' } } },
        ],
      });
      expect(schema.safeParse({ a: 'hello', b: 42 }).success).toBe(true);
    });

    it('handles missing type as any', () => {
      const schema = jsonSchemaTypeToZod({});
      expect(schema.safeParse('anything').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(true);
    });
  });

  describe('applyNullable', () => {
    it('makes schema nullable when nullable is true', () => {
      const base = z.string();
      const nullable = applyNullable(base, { nullable: true });
      expect(nullable.safeParse(null).success).toBe(true);
    });

    it('does not modify schema when nullable is false', () => {
      const base = z.string();
      const notNullable = applyNullable(base, { nullable: false });
      expect(notNullable.safeParse(null).success).toBe(false);
    });

    it('handles type array with null', () => {
      const base = z.string();
      const nullable = applyNullable(base, { type: ['string', 'null'] });
      expect(nullable.safeParse(null).success).toBe(true);
    });
  });

  describe('applyDescription', () => {
    it('adds description to schema', () => {
      const base = z.string();
      const described = applyDescription(base, 'A user name');
      expect(described.description).toBe('A user name');
    });

    it('does not modify schema when description is undefined', () => {
      const base = z.string();
      const same = applyDescription(base, undefined);
      expect(same.description).toBeUndefined();
    });
  });

  describe('applyDefault', () => {
    it('adds default value to schema', () => {
      const base = z.string();
      const withDefault = applyDefault(base, 'default');
      expect(withDefault.safeParse(undefined).success).toBe(true);
    });

    it('does not modify schema when default is undefined', () => {
      const base = z.string();
      const same = applyDefault(base, undefined);
      expect(same.safeParse(undefined).success).toBe(false);
    });
  });

  describe('jsonSchemaToZod', () => {
    it('applies all modifiers', () => {
      const schema = jsonSchemaToZod({
        type: 'string',
        description: 'A name',
        default: 'Anonymous',
        nullable: true,
      });
      
      expect(schema.safeParse(null).success).toBe(true);
      expect(schema.safeParse(undefined).success).toBe(true);
      expect(schema.description).toBe('A name');
    });
  });

  describe('buildInputSchema', () => {
    it('builds schema from parameters', () => {
      const schema = buildInputSchema([
        { name: 'id', schema: { type: 'string' }, required: true },
        { name: 'limit', schema: { type: 'integer' }, required: false },
      ]);
      
      expect(schema.safeParse({ id: 'abc' }).success).toBe(true);
      expect(schema.safeParse({ id: 'abc', limit: 10 }).success).toBe(true);
      expect(schema.safeParse({}).success).toBe(false);
    });

    it('includes request body', () => {
      const schema = buildInputSchema(
        [{ name: 'id', schema: { type: 'string' }, required: true }],
        { type: 'object', properties: { name: { type: 'string' } } }
      );
      
      const result = schema.safeParse({ id: 'abc', body: { name: 'John' } });
      expect(result.success).toBe(true);
    });
  });

  describe('validateInput', () => {
    it('returns success for valid input', () => {
      const schema = z.object({ name: z.string() });
      const result = validateInput(schema, { name: 'John' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
      }
    });

    it('returns errors for invalid input', () => {
      const schema = z.object({ name: z.string() });
      const result = validateInput(schema, { name: 123 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
      }
    });
  });
});
