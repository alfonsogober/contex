/**
 * Core TypeScript types for the MCP library.
 * @module core/types
 */
import type { z } from 'zod';
/** HTTP methods supported by OpenAPI */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';
/** Transport types for MCP server */
export type TransportType = 'streamable-http' | 'stdio';
/** OpenAPI specification version */
export type OpenApiVersion = '3.0' | '3.1';
/** JSON Schema types */
export type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
/** JSON Schema definition */
export interface JsonSchema {
    readonly type?: JsonSchemaType | JsonSchemaType[];
    readonly properties?: Record<string, JsonSchema>;
    readonly items?: JsonSchema;
    readonly required?: string[];
    readonly enum?: unknown[];
    readonly format?: string;
    readonly minimum?: number;
    readonly maximum?: number;
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly pattern?: string;
    readonly default?: unknown;
    readonly description?: string;
    readonly $ref?: string;
    readonly allOf?: JsonSchema[];
    readonly anyOf?: JsonSchema[];
    readonly oneOf?: JsonSchema[];
    readonly nullable?: boolean;
    readonly additionalProperties?: boolean | JsonSchema;
}
/** OpenAPI parameter location */
export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie';
/** OpenAPI parameter definition */
export interface OpenApiParameter {
    readonly name: string;
    readonly in: ParameterLocation;
    readonly required?: boolean;
    readonly description?: string;
    readonly schema: JsonSchema;
    readonly deprecated?: boolean;
}
/** OpenAPI request body definition */
export interface OpenApiRequestBody {
    readonly description?: string;
    readonly required?: boolean;
    readonly content: Record<string, {
        schema: JsonSchema;
    }>;
}
/** OpenAPI response definition */
export interface OpenApiResponse {
    readonly description: string;
    readonly content?: Record<string, {
        schema: JsonSchema;
    }>;
}
/** OpenAPI security requirement */
export type SecurityRequirement = Record<string, string[]>;
/** OpenAPI operation extracted from spec */
export interface Operation {
    readonly operationId?: string;
    readonly method: HttpMethod;
    readonly path: string;
    readonly summary?: string;
    readonly description?: string;
    readonly parameters?: OpenApiParameter[];
    readonly requestBody?: OpenApiRequestBody;
    readonly responses?: Record<string, OpenApiResponse>;
    readonly security?: SecurityRequirement[];
    readonly tags?: string[];
    readonly deprecated?: boolean;
}
/** OpenAPI security scheme */
export interface SecurityScheme {
    readonly type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
    readonly name?: string;
    readonly in?: 'query' | 'header' | 'cookie';
    readonly scheme?: string;
    readonly bearerFormat?: string;
    readonly flows?: OAuthFlows;
    readonly openIdConnectUrl?: string;
}
/** OAuth flows configuration */
export interface OAuthFlows {
    readonly authorizationCode?: {
        readonly authorizationUrl: string;
        readonly tokenUrl: string;
        readonly refreshUrl?: string;
        readonly scopes: Record<string, string>;
    };
    readonly clientCredentials?: {
        readonly tokenUrl: string;
        readonly refreshUrl?: string;
        readonly scopes: Record<string, string>;
    };
    readonly implicit?: {
        readonly authorizationUrl: string;
        readonly refreshUrl?: string;
        readonly scopes: Record<string, string>;
    };
    readonly password?: {
        readonly tokenUrl: string;
        readonly refreshUrl?: string;
        readonly scopes: Record<string, string>;
    };
}
/** Parsed OpenAPI specification */
export interface OpenApiSpec {
    readonly openapi: string;
    readonly info: {
        readonly title: string;
        readonly version: string;
        readonly description?: string;
    };
    readonly servers?: Array<{
        url: string;
        description?: string;
    }>;
    readonly paths: Record<string, Record<string, unknown>>;
    readonly components?: {
        readonly schemas?: Record<string, JsonSchema>;
        readonly securitySchemes?: Record<string, SecurityScheme>;
        readonly parameters?: Record<string, OpenApiParameter>;
        readonly requestBodies?: Record<string, OpenApiRequestBody>;
        readonly responses?: Record<string, OpenApiResponse>;
    };
    readonly security?: SecurityRequirement[];
}
/** MCP tool definition */
export interface McpTool {
    readonly name: string;
    readonly description: string;
    readonly inputSchema: z.ZodSchema;
    readonly operation: Operation;
    readonly baseUrl: string;
}
/** MCP resource definition */
export interface McpResource {
    readonly uri: string;
    readonly name: string;
    readonly description?: string;
    readonly mimeType?: string;
}
/** OAuth configuration */
export interface OAuthConfig {
    readonly type: 'oauth2';
    readonly clientId: string;
    readonly clientSecret: string;
    readonly authorizationUrl: string;
    readonly tokenUrl: string;
    readonly scopes: string[];
    readonly pkce?: boolean;
    readonly redirectUri?: string;
}
/** API Key authentication configuration */
export interface ApiKeyConfig {
    readonly type: 'apiKey';
    readonly key: string;
    readonly headerName?: string;
    readonly queryParamName?: string;
}
/** Bearer token authentication configuration */
export interface BearerConfig {
    readonly type: 'bearer';
    readonly token: string;
}
/** Authentication configuration union */
export type AuthConfig = OAuthConfig | ApiKeyConfig | BearerConfig;
/** Server configuration */
export interface ServerConfig {
    readonly port: number;
    readonly transport: TransportType;
    readonly cors?: {
        readonly origin: string | string[];
        readonly methods?: string[];
        readonly allowedHeaders?: string[];
    };
    readonly host?: string;
}
/** Main MCP server configuration */
export interface McpServerConfig {
    readonly name: string;
    readonly version: string;
    readonly openApiSpec: string | OpenApiSpec;
    readonly baseUrl: string;
    readonly auth?: AuthConfig;
    readonly server?: Partial<ServerConfig>;
    readonly toolFilter?: (operation: Operation) => boolean;
    readonly resourceFilter?: (schema: JsonSchema, name: string) => boolean;
}
/** Token set from OAuth */
export interface TokenSet {
    readonly accessToken: string;
    readonly tokenType: string;
    readonly expiresAt?: number;
    readonly refreshToken?: string;
    readonly scope?: string;
}
/** PKCE parameters */
export interface PkceParams {
    readonly codeVerifier: string;
    readonly codeChallenge: string;
    readonly codeChallengeMethod: 'S256';
}
/** HTTP request configuration */
export interface HttpRequestConfig {
    readonly method: HttpMethod;
    readonly url: string;
    readonly headers?: Record<string, string>;
    readonly params?: Record<string, unknown>;
    readonly data?: unknown;
    readonly timeout?: number;
}
/** HTTP response */
export interface HttpResponse<T = unknown> {
    readonly status: number;
    readonly statusText: string;
    readonly headers: Record<string, string>;
    readonly data: T;
}
/** Schema metadata for validation */
export interface SchemaMeta {
    readonly name: string;
    readonly description?: string;
    readonly deprecated?: boolean;
}
//# sourceMappingURL=types.d.ts.map