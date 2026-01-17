/**
 * Main server factory for creating MCP servers.
 * Provides the primary API for the library.
 * @module server/createServer
 */
import { ok, err, isErr } from '../core/result.js';
import { configError } from '../core/errors.js';
import { parseOpenApiSpec, validateOpenApiVersion, extractOperations } from '../openapi/parser.js';
import { buildToolsPipeline } from '../openapi/toolGenerator.js';
import { buildResourcesPipeline } from '../openapi/resourceGenerator.js';
import { createHttpClient } from '../http/client.js';
import { createMcpApp } from './transports/streamableHttp.js';
import { startStdioServer } from './transports/stdio.js';
/**
 * Default server configuration.
 */
const DEFAULT_SERVER_CONFIG = {
    port: 3000,
    transport: 'streamable-http',
    host: '0.0.0.0',
};
/**
 * Validates the MCP server configuration.
 * @param config - Configuration to validate
 * @returns Result containing config or error
 */
export const validateConfig = (config) => {
    if (!config.name || config.name.trim() === '') {
        return err(configError('Server name is required', 'name'));
    }
    if (!config.version || config.version.trim() === '') {
        return err(configError('Server version is required', 'version'));
    }
    if (!config.openApiSpec) {
        return err(configError('OpenAPI specification is required', 'openApiSpec'));
    }
    if (!config.baseUrl || config.baseUrl.trim() === '') {
        return err(configError('Base URL is required', 'baseUrl'));
    }
    try {
        new URL(config.baseUrl);
    }
    catch {
        return err(configError('Invalid base URL', 'baseUrl'));
    }
    return ok(config);
};
/**
 * Loads the OpenAPI specification from various sources.
 * @param spec - Path, URL, or specification object
 * @returns Result containing parsed spec
 */
const loadOpenApiSpec = async (spec) => {
    const result = await parseOpenApiSpec(spec);
    if (isErr(result)) {
        return err(configError(result.error.message, 'openApiSpec'));
    }
    const validationResult = validateOpenApiVersion(result.value);
    if (isErr(validationResult)) {
        return err(configError(validationResult.error.message, 'openApiSpec'));
    }
    return ok(validationResult.value);
};
/**
 * Builds tools from an OpenAPI specification.
 * @param spec - Parsed OpenAPI specification
 * @param baseUrl - Base URL for API calls
 * @param filter - Optional filter function
 * @returns Array of MCP tools
 */
const buildTools = (spec, baseUrl, filter) => {
    const operations = extractOperations(spec);
    const filteredOperations = filter
        ? operations.filter(filter)
        : operations;
    return buildToolsPipeline(baseUrl)(filteredOperations);
};
/**
 * Builds resources from an OpenAPI specification.
 * @param spec - Parsed OpenAPI specification
 * @param filter - Optional filter function
 * @returns Array of MCP resources
 */
const buildResources = (spec, filter) => {
    const resources = buildResourcesPipeline(spec);
    if (!filter)
        return resources;
    return resources.filter((resource) => {
        const schema = spec.components?.schemas?.[resource.name];
        return schema ? filter(schema, resource.name) : true;
    });
};
/**
 * Creates a tool execution context.
 * @param config - Server configuration
 * @returns Tool context
 */
const createToolContext = (config) => {
    const httpClient = createHttpClient({
        baseUrl: config.baseUrl,
        timeout: 30000,
    });
    return {
        httpClient,
        token: undefined,
    };
};
/**
 * Creates an MCP server from configuration.
 * @param config - Server configuration
 * @returns Result containing server instance or error
 */
export const createMcpServer = async (config) => {
    const validationResult = validateConfig(config);
    if (isErr(validationResult)) {
        return validationResult;
    }
    const specResult = await loadOpenApiSpec(config.openApiSpec);
    if (isErr(specResult)) {
        return specResult;
    }
    const spec = specResult.value;
    const tools = buildTools(spec, config.baseUrl, config.toolFilter);
    const resources = buildResources(spec, config.resourceFilter);
    const context = createToolContext(config);
    const serverConfig = {
        ...DEFAULT_SERVER_CONFIG,
        ...config.server,
    };
    let httpServer;
    let app;
    let cleanup;
    const server = {
        name: config.name,
        version: config.version,
        tools,
        resources,
        start: async () => {
            if (serverConfig.transport === 'stdio') {
                const stdioConfig = {
                    serverName: config.name,
                    serverVersion: config.version,
                    tools,
                    resources,
                    context,
                };
                cleanup = startStdioServer(stdioConfig);
            }
            else {
                const httpConfig = {
                    serverName: config.name,
                    serverVersion: config.version,
                    tools,
                    resources,
                    context,
                    cors: serverConfig.cors,
                    stateful: true,
                };
                app = createMcpApp(httpConfig);
                await new Promise((resolve) => {
                    httpServer = app.listen(serverConfig.port, serverConfig.host ?? '0.0.0.0', () => {
                        console.log(`MCP server "${config.name}" listening on ${serverConfig.host ?? '0.0.0.0'}:${serverConfig.port}`);
                        resolve();
                    });
                });
            }
        },
        stop: async () => {
            if (cleanup) {
                cleanup();
            }
            if (httpServer) {
                await new Promise((resolve, reject) => {
                    httpServer.close((err) => {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                });
            }
        },
        getApp: () => app,
    };
    return ok(server);
};
/**
 * Creates a minimal MCP server with custom tools.
 * @param name - Server name
 * @param version - Server version
 * @param tools - Custom tool definitions
 * @param resources - Custom resource definitions
 * @param config - Optional server configuration
 * @returns Result containing server instance
 */
export const createCustomMcpServer = async (name, version, tools, resources, config) => {
    const serverConfig = {
        ...DEFAULT_SERVER_CONFIG,
        ...config,
    };
    const context = {
        httpClient: createHttpClient(),
        token: undefined,
    };
    let httpServer;
    let app;
    const server = {
        name,
        version,
        tools,
        resources,
        start: async () => {
            const httpConfig = {
                serverName: name,
                serverVersion: version,
                tools,
                resources,
                context,
                cors: serverConfig.cors,
                stateful: true,
            };
            app = createMcpApp(httpConfig);
            await new Promise((resolve) => {
                httpServer = app.listen(serverConfig.port, serverConfig.host ?? '0.0.0.0', () => {
                    console.log(`MCP server "${name}" listening on ${serverConfig.host ?? '0.0.0.0'}:${serverConfig.port}`);
                    resolve();
                });
            });
        },
        stop: async () => {
            if (httpServer) {
                await new Promise((resolve, reject) => {
                    httpServer.close((err) => {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                });
            }
        },
        getApp: () => app,
    };
    return ok(server);
};
//# sourceMappingURL=createServer.js.map