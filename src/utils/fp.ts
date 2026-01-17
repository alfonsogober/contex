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
export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

/**
 * Type guard for checking if a value is a string.
 * @param value - Value to check
 * @returns True if value is a string
 */
export const isString = (value: unknown): value is string =>
  typeof value === 'string';

/**
 * Type guard for checking if a value is a number.
 * @param value - Value to check
 * @returns True if value is a number
 */
export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && !Number.isNaN(value);

/**
 * Type guard for checking if a value is a boolean.
 * @param value - Value to check
 * @returns True if value is a boolean
 */
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

/**
 * Type guard for checking if a value is an object.
 * @param value - Value to check
 * @returns True if value is an object
 */
export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Type guard for checking if a value is an array.
 * @param value - Value to check
 * @returns True if value is an array
 */
export const isArray = <T = unknown>(value: unknown): value is T[] =>
  Array.isArray(value);

/**
 * Type guard for checking if a value is a function.
 * @param value - Value to check
 * @returns True if value is a function
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const isFunction = (value: unknown): value is Function =>
  typeof value === 'function';

/**
 * Safely gets a nested property from an object.
 * @param path - Property path as array of keys
 * @returns A function that takes an object and returns the value or undefined
 */
export const getPath =
  <T>(path: string[]) =>
  (obj: unknown): T | undefined =>
    R.path(path, obj as object) as T | undefined;

/**
 * Safely sets a nested property in an object (immutably).
 * @param path - Property path as array of keys
 * @param value - Value to set
 * @returns A function that takes an object and returns a new object
 */
export const setPath =
  <T>(path: string[], value: unknown) =>
  (obj: T): T =>
    R.assocPath(path, value, obj);

/**
 * Filters out null and undefined values from an array.
 * @param arr - Array that may contain null/undefined values
 * @returns Array with only defined values
 */
export const compact = <T>(arr: (T | null | undefined)[]): T[] =>
  arr.filter(isDefined);

/**
 * Creates a lookup object from an array using a key selector.
 * @param keySelector - Function to extract the key from each item
 * @returns A function that takes an array and returns a lookup object
 */
export const indexBy =
  <T, K extends string | number>(keySelector: (item: T) => K) =>
  (items: T[]): Record<K, T> =>
    R.indexBy(keySelector, items) as Record<K, T>;

/**
 * Groups array items by a key selector function.
 * @param keySelector - Function to extract the group key from each item
 * @returns A function that takes an array and returns grouped items
 */
export const groupBy =
  <T, K extends string>(keySelector: (item: T) => K) =>
  (items: T[]): Record<K, T[]> =>
    R.groupBy(keySelector, items) as Record<K, T[]>;

/**
 * Transforms object values using a mapping function.
 * @param fn - Function to transform each value
 * @returns A function that takes an object and returns transformed object
 */
export const mapValues =
  <T, U>(fn: (value: T, key: string) => U) =>
  (obj: Record<string, T>): Record<string, U> =>
    R.mapObjIndexed(fn, obj);

/**
 * Filters object entries by a predicate.
 * @param predicate - Function to test each entry
 * @returns A function that takes an object and returns filtered object
 */
export const filterEntries =
  <T>(predicate: (value: T, key: string) => boolean) =>
  (obj: Record<string, T>): Record<string, T> =>
    R.pickBy(predicate, obj);

/**
 * Deep merges two objects.
 * @param source - Source object
 * @param target - Target object
 * @returns Merged object
 */
export const deepMerge = <T extends object>(source: T, target: Partial<T>): T =>
  R.mergeDeepRight(source, target) as unknown as T;

/**
 * Creates a function that memoizes the last result.
 * Only recalculates if the argument changes.
 * @param fn - Function to memoize
 * @returns Memoized function
 */
export const memoizeLast = <T, R>(fn: (arg: T) => R): ((arg: T) => R) => {
  let lastArg: T | undefined;
  let lastResult: R | undefined;
  let hasResult = false;

  return (arg: T): R => {
    if (hasResult && R.equals(arg, lastArg)) {
      return lastResult as R;
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
export const safeJsonParse = <T = unknown>(json: string): T | undefined => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
};

/**
 * Creates a delay promise.
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Omits specified keys from an object.
 * @param keys - Keys to omit
 * @returns A function that takes an object and returns object without keys
 */
export const omitKeys =
  <T extends object, K extends keyof T>(keys: K[]) =>
  (obj: T): Omit<T, K> =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    R.omit(keys as any, obj) as Omit<T, K>;

/**
 * Picks specified keys from an object.
 * @param keys - Keys to pick
 * @returns A function that takes an object and returns object with only keys
 */
export const pickKeys =
  <T extends object, K extends keyof T>(keys: K[]) =>
  (obj: T): Pick<T, K> =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    R.pick(keys as any, obj) as Pick<T, K>;

/**
 * Converts a string to camelCase.
 * @param str - String to convert
 * @returns camelCase string
 */
export const toCamelCase = (str: string): string =>
  str
    .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) =>
      c ? c.toUpperCase() : ''
    )
    .replace(/^[A-Z]/, (c) => c.toLowerCase());

/**
 * Converts a string to snake_case.
 * @param str - String to convert
 * @returns snake_case string
 */
export const toSnakeCase = (str: string): string =>
  str
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
export const truncate =
  (maxLength: number, suffix = '...') =>
  (str: string): string =>
    str.length <= maxLength ? str : str.slice(0, maxLength - suffix.length) + suffix;
