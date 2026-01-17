/**
 * Functional programming utilities and type guards.
 * @module utils/fp
 */
import * as R from 'ramda';
/**
 * Type guard for checking if a value is not null or undefined.
 * @param value - Value to check
 * @returns True if value is defined
 */
export const isDefined = (value) => value !== null && value !== undefined;
/**
 * Type guard for checking if a value is a string.
 * @param value - Value to check
 * @returns True if value is a string
 */
export const isString = (value) => typeof value === 'string';
/**
 * Type guard for checking if a value is a number.
 * @param value - Value to check
 * @returns True if value is a number
 */
export const isNumber = (value) => typeof value === 'number' && !Number.isNaN(value);
/**
 * Type guard for checking if a value is a boolean.
 * @param value - Value to check
 * @returns True if value is a boolean
 */
export const isBoolean = (value) => typeof value === 'boolean';
/**
 * Type guard for checking if a value is an object.
 * @param value - Value to check
 * @returns True if value is an object
 */
export const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
/**
 * Type guard for checking if a value is an array.
 * @param value - Value to check
 * @returns True if value is an array
 */
export const isArray = (value) => Array.isArray(value);
/**
 * Type guard for checking if a value is a function.
 * @param value - Value to check
 * @returns True if value is a function
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const isFunction = (value) => typeof value === 'function';
/**
 * Safely gets a nested property from an object.
 * @param path - Property path as array of keys
 * @returns A function that takes an object and returns the value or undefined
 */
export const getPath = (path) => (obj) => R.path(path, obj);
/**
 * Safely sets a nested property in an object (immutably).
 * @param path - Property path as array of keys
 * @param value - Value to set
 * @returns A function that takes an object and returns a new object
 */
export const setPath = (path, value) => (obj) => R.assocPath(path, value, obj);
/**
 * Filters out null and undefined values from an array.
 * @param arr - Array that may contain null/undefined values
 * @returns Array with only defined values
 */
export const compact = (arr) => arr.filter(isDefined);
/**
 * Creates a lookup object from an array using a key selector.
 * @param keySelector - Function to extract the key from each item
 * @returns A function that takes an array and returns a lookup object
 */
export const indexBy = (keySelector) => (items) => R.indexBy(keySelector, items);
/**
 * Groups array items by a key selector function.
 * @param keySelector - Function to extract the group key from each item
 * @returns A function that takes an array and returns grouped items
 */
export const groupBy = (keySelector) => (items) => R.groupBy(keySelector, items);
/**
 * Transforms object values using a mapping function.
 * @param fn - Function to transform each value
 * @returns A function that takes an object and returns transformed object
 */
export const mapValues = (fn) => (obj) => R.mapObjIndexed(fn, obj);
/**
 * Filters object entries by a predicate.
 * @param predicate - Function to test each entry
 * @returns A function that takes an object and returns filtered object
 */
export const filterEntries = (predicate) => (obj) => R.pickBy(predicate, obj);
/**
 * Deep merges two objects.
 * @param source - Source object
 * @param target - Target object
 * @returns Merged object
 */
export const deepMerge = (source, target) => R.mergeDeepRight(source, target);
/**
 * Creates a function that memoizes the last result.
 * Only recalculates if the argument changes.
 * @param fn - Function to memoize
 * @returns Memoized function
 */
export const memoizeLast = (fn) => {
    let lastArg;
    let lastResult;
    let hasResult = false;
    return (arg) => {
        if (hasResult && R.equals(arg, lastArg)) {
            return lastResult;
        }
        lastArg = arg;
        lastResult = fn(arg);
        hasResult = true;
        return lastResult;
    };
};
/**
 * Safely parses JSON, returning undefined on failure.
 * @param json - JSON string to parse
 * @returns Parsed value or undefined
 */
export const safeJsonParse = (json) => {
    try {
        return JSON.parse(json);
    }
    catch {
        return undefined;
    }
};
/**
 * Creates a delay promise.
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Omits specified keys from an object.
 * @param keys - Keys to omit
 * @returns A function that takes an object and returns object without keys
 */
export const omitKeys = (keys) => (obj) => 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
R.omit(keys, obj);
/**
 * Picks specified keys from an object.
 * @param keys - Keys to pick
 * @returns A function that takes an object and returns object with only keys
 */
export const pickKeys = (keys) => (obj) => 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
R.pick(keys, obj);
/**
 * Converts a string to camelCase.
 * @param str - String to convert
 * @returns camelCase string
 */
export const toCamelCase = (str) => str
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
/**
 * Converts a string to snake_case.
 * @param str - String to convert
 * @returns snake_case string
 */
export const toSnakeCase = (str) => str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/[-\s]+/g, '_');
/**
 * Truncates a string to a maximum length.
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add if truncated (default: '...')
 * @returns A function that takes a string and returns truncated string
 */
export const truncate = (maxLength, suffix = '...') => (str) => str.length <= maxLength ? str : str.slice(0, maxLength - suffix.length) + suffix;
//# sourceMappingURL=fp.js.map