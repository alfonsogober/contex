/**
 * Functional programming utilities and type guards.
 * @module utils/fp
 */
/**
 * Type guard for checking if a value is not null or undefined.
 * @param value - Value to check
 * @returns True if value is defined
 */
export declare const isDefined: <T>(value: T | null | undefined) => value is T;
/**
 * Type guard for checking if a value is a string.
 * @param value - Value to check
 * @returns True if value is a string
 */
export declare const isString: (value: unknown) => value is string;
/**
 * Type guard for checking if a value is a number.
 * @param value - Value to check
 * @returns True if value is a number
 */
export declare const isNumber: (value: unknown) => value is number;
/**
 * Type guard for checking if a value is a boolean.
 * @param value - Value to check
 * @returns True if value is a boolean
 */
export declare const isBoolean: (value: unknown) => value is boolean;
/**
 * Type guard for checking if a value is an object.
 * @param value - Value to check
 * @returns True if value is an object
 */
export declare const isObject: (value: unknown) => value is Record<string, unknown>;
/**
 * Type guard for checking if a value is an array.
 * @param value - Value to check
 * @returns True if value is an array
 */
export declare const isArray: <T = unknown>(value: unknown) => value is T[];
/**
 * Type guard for checking if a value is a function.
 * @param value - Value to check
 * @returns True if value is a function
 */
export declare const isFunction: (value: unknown) => value is Function;
/**
 * Safely gets a nested property from an object.
 * @param path - Property path as array of keys
 * @returns A function that takes an object and returns the value or undefined
 */
export declare const getPath: <T>(path: string[]) => (obj: unknown) => T | undefined;
/**
 * Safely sets a nested property in an object (immutably).
 * @param path - Property path as array of keys
 * @param value - Value to set
 * @returns A function that takes an object and returns a new object
 */
export declare const setPath: <T>(path: string[], value: unknown) => (obj: T) => T;
/**
 * Filters out null and undefined values from an array.
 * @param arr - Array that may contain null/undefined values
 * @returns Array with only defined values
 */
export declare const compact: <T>(arr: (T | null | undefined)[]) => T[];
/**
 * Creates a lookup object from an array using a key selector.
 * @param keySelector - Function to extract the key from each item
 * @returns A function that takes an array and returns a lookup object
 */
export declare const indexBy: <T, K extends string | number>(keySelector: (item: T) => K) => (items: T[]) => Record<K, T>;
/**
 * Groups array items by a key selector function.
 * @param keySelector - Function to extract the group key from each item
 * @returns A function that takes an array and returns grouped items
 */
export declare const groupBy: <T, K extends string>(keySelector: (item: T) => K) => (items: T[]) => Record<K, T[]>;
/**
 * Transforms object values using a mapping function.
 * @param fn - Function to transform each value
 * @returns A function that takes an object and returns transformed object
 */
export declare const mapValues: <T, U>(fn: (value: T, key: string) => U) => (obj: Record<string, T>) => Record<string, U>;
/**
 * Filters object entries by a predicate.
 * @param predicate - Function to test each entry
 * @returns A function that takes an object and returns filtered object
 */
export declare const filterEntries: <T>(predicate: (value: T, key: string) => boolean) => (obj: Record<string, T>) => Record<string, T>;
/**
 * Deep merges two objects.
 * @param source - Source object
 * @param target - Target object
 * @returns Merged object
 */
export declare const deepMerge: <T extends object>(source: T, target: Partial<T>) => T;
/**
 * Creates a function that memoizes the last result.
 * Only recalculates if the argument changes.
 * @param fn - Function to memoize
 * @returns Memoized function
 */
export declare const memoizeLast: <T, R>(fn: (arg: T) => R) => ((arg: T) => R);
/**
 * Safely parses JSON, returning undefined on failure.
 * @param json - JSON string to parse
 * @returns Parsed value or undefined
 */
export declare const safeJsonParse: <T = unknown>(json: string) => T | undefined;
/**
 * Creates a delay promise.
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export declare const delay: (ms: number) => Promise<void>;
/**
 * Omits specified keys from an object.
 * @param keys - Keys to omit
 * @returns A function that takes an object and returns object without keys
 */
export declare const omitKeys: <T extends object, K extends keyof T>(keys: K[]) => (obj: T) => Omit<T, K>;
/**
 * Picks specified keys from an object.
 * @param keys - Keys to pick
 * @returns A function that takes an object and returns object with only keys
 */
export declare const pickKeys: <T extends object, K extends keyof T>(keys: K[]) => (obj: T) => Pick<T, K>;
/**
 * Converts a string to camelCase.
 * @param str - String to convert
 * @returns camelCase string
 */
export declare const toCamelCase: (str: string) => string;
/**
 * Converts a string to snake_case.
 * @param str - String to convert
 * @returns snake_case string
 */
export declare const toSnakeCase: (str: string) => string;
/**
 * Truncates a string to a maximum length.
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add if truncated (default: '...')
 * @returns A function that takes a string and returns truncated string
 */
export declare const truncate: (maxLength: number, suffix?: string) => (str: string) => string;
//# sourceMappingURL=fp.d.ts.map