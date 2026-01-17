import { describe, it, expect } from 'vitest';
import {
  parseError,
  configError,
  schemaError,
  oauthError,
  tokenError,
  httpError,
  toolError,
  serverError,
  validationError,
  formatError,
  isParseError,
  isConfigError,
  isSchemaError,
  isOAuthError,
  isTokenError,
  isHttpError,
  isToolError,
  isServerError,
  isValidationError,
} from '../../../src/core/errors.js';

describe('Error constructors', () => {
  describe('parseError', () => {
    it('creates a ParseError with message', () => {
      const error = parseError('Failed to parse');
      expect(error._tag).toBe('ParseError');
      expect(error.message).toBe('Failed to parse');
    });

    it('includes optional source', () => {
      const error = parseError('Failed', 'file.yaml');
      expect(error.source).toBe('file.yaml');
    });

    it('includes optional details', () => {
      const details = { line: 10, column: 5 };
      const error = parseError('Failed', undefined, details);
      expect(error.details).toEqual(details);
    });
  });

  describe('configError', () => {
    it('creates a ConfigError with message', () => {
      const error = configError('Invalid config');
      expect(error._tag).toBe('ConfigError');
      expect(error.message).toBe('Invalid config');
    });

    it('includes optional field', () => {
      const error = configError('Missing value', 'apiKey');
      expect(error.field).toBe('apiKey');
    });
  });

  describe('schemaError', () => {
    it('creates a SchemaError with message', () => {
      const error = schemaError('Invalid schema');
      expect(error._tag).toBe('SchemaError');
      expect(error.message).toBe('Invalid schema');
    });

    it('includes optional path and type', () => {
      const error = schemaError('Type mismatch', '#/properties/id', 'string');
      expect(error.schemaPath).toBe('#/properties/id');
      expect(error.schemaType).toBe('string');
    });
  });

  describe('oauthError', () => {
    it('creates an OAuthError with message', () => {
      const error = oauthError('Auth failed');
      expect(error._tag).toBe('OAuthError');
      expect(error.message).toBe('Auth failed');
    });

    it('includes optional code and status', () => {
      const error = oauthError('Invalid grant', 'invalid_grant', 400);
      expect(error.code).toBe('invalid_grant');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('tokenError', () => {
    it('creates a TokenError with message', () => {
      const error = tokenError('Token expired');
      expect(error._tag).toBe('TokenError');
      expect(error.message).toBe('Token expired');
    });

    it('includes optional token type', () => {
      const error = tokenError('Invalid', 'refresh');
      expect(error.tokenType).toBe('refresh');
    });
  });

  describe('httpError', () => {
    it('creates an HttpError with message and status', () => {
      const error = httpError('Not found', 404);
      expect(error._tag).toBe('HttpError');
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
    });

    it('includes optional url and method', () => {
      const error = httpError('Not found', 404, '/api/users', 'GET');
      expect(error.url).toBe('/api/users');
      expect(error.method).toBe('GET');
    });
  });

  describe('toolError', () => {
    it('creates a ToolError with message and tool name', () => {
      const error = toolError('Execution failed', 'getUsers');
      expect(error._tag).toBe('ToolError');
      expect(error.message).toBe('Execution failed');
      expect(error.toolName).toBe('getUsers');
    });

    it('includes optional cause', () => {
      const cause = new Error('Original error');
      const error = toolError('Failed', 'getTool', cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('serverError', () => {
    it('creates a ServerError with message', () => {
      const error = serverError('Server crashed');
      expect(error._tag).toBe('ServerError');
      expect(error.message).toBe('Server crashed');
    });

    it('includes optional code', () => {
      const error = serverError('Port in use', 'EADDRINUSE');
      expect(error.code).toBe('EADDRINUSE');
    });
  });

  describe('validationError', () => {
    it('creates a ValidationError with message', () => {
      const error = validationError('Invalid input');
      expect(error._tag).toBe('ValidationError');
      expect(error.message).toBe('Invalid input');
    });

    it('includes optional path, expected, and received', () => {
      const error = validationError('Type mismatch', 'user.age', 'number', 'string');
      expect(error.path).toBe('user.age');
      expect(error.expected).toBe('number');
      expect(error.received).toBe('string');
    });
  });
});

describe('Type guards', () => {
  it('isParseError identifies ParseError', () => {
    expect(isParseError(parseError('test'))).toBe(true);
    expect(isParseError(configError('test'))).toBe(false);
  });

  it('isConfigError identifies ConfigError', () => {
    expect(isConfigError(configError('test'))).toBe(true);
    expect(isConfigError(parseError('test'))).toBe(false);
  });

  it('isSchemaError identifies SchemaError', () => {
    expect(isSchemaError(schemaError('test'))).toBe(true);
    expect(isSchemaError(parseError('test'))).toBe(false);
  });

  it('isOAuthError identifies OAuthError', () => {
    expect(isOAuthError(oauthError('test'))).toBe(true);
    expect(isOAuthError(parseError('test'))).toBe(false);
  });

  it('isTokenError identifies TokenError', () => {
    expect(isTokenError(tokenError('test'))).toBe(true);
    expect(isTokenError(parseError('test'))).toBe(false);
  });

  it('isHttpError identifies HttpError', () => {
    expect(isHttpError(httpError('test', 500))).toBe(true);
    expect(isHttpError(parseError('test'))).toBe(false);
  });

  it('isToolError identifies ToolError', () => {
    expect(isToolError(toolError('test', 'tool'))).toBe(true);
    expect(isToolError(parseError('test'))).toBe(false);
  });

  it('isServerError identifies ServerError', () => {
    expect(isServerError(serverError('test'))).toBe(true);
    expect(isServerError(parseError('test'))).toBe(false);
  });

  it('isValidationError identifies ValidationError', () => {
    expect(isValidationError(validationError('test'))).toBe(true);
    expect(isValidationError(parseError('test'))).toBe(false);
  });
});

describe('formatError', () => {
  it('formats ParseError', () => {
    const error = parseError('Failed to parse', 'spec.yaml');
    expect(formatError(error)).toBe('Parse Error: Failed to parse (source: spec.yaml)');
  });

  it('formats ConfigError', () => {
    const error = configError('Missing value', 'apiKey');
    expect(formatError(error)).toBe('Config Error: Missing value (field: apiKey)');
  });

  it('formats SchemaError', () => {
    const error = schemaError('Invalid type', '#/properties/id');
    expect(formatError(error)).toBe('Schema Error: Invalid type (path: #/properties/id)');
  });

  it('formats OAuthError', () => {
    const error = oauthError('Invalid grant', 'invalid_grant');
    expect(formatError(error)).toBe('OAuth Error: Invalid grant (code: invalid_grant)');
  });

  it('formats TokenError', () => {
    const error = tokenError('Token expired');
    expect(formatError(error)).toBe('Token Error: Token expired');
  });

  it('formats HttpError', () => {
    const error = httpError('Not found', 404, '/api/users', 'GET');
    expect(formatError(error)).toBe('HTTP Error 404: Not found (GET /api/users)');
  });

  it('formats ToolError', () => {
    const error = toolError('Execution failed', 'getUsers');
    expect(formatError(error)).toBe('Tool Error [getUsers]: Execution failed');
  });

  it('formats ServerError', () => {
    const error = serverError('Port in use', 'EADDRINUSE');
    expect(formatError(error)).toBe('Server Error: Port in use (code: EADDRINUSE)');
  });

  it('formats ValidationError', () => {
    const error = validationError('Invalid input', 'user.email');
    expect(formatError(error)).toBe('Validation Error: Invalid input (path: user.email)');
  });
});
