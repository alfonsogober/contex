/**
 * Result monad for functional error handling.
 * Provides a type-safe alternative to throwing exceptions.
 * @module core/result
 */
import * as R from 'ramda';
/**
 * Creates a successful Result containing the given value.
 * @param value - The success value
 * @returns An Ok result containing the value
 */
export const ok = (value) => ({ _tag: 'Ok', value });
/**
 * Creates a failed Result containing the given error.
 * @param error - The error value
 * @returns An Err result containing the error
 */
export const err = (error) => ({ _tag: 'Err', error });
/**
 * Type guard to check if a Result is Ok.
 * @param result - The result to check
 * @returns True if the result is Ok
 */
export const isOk = (result) => result._tag === 'Ok';
/**
 * Type guard to check if a Result is Err.
 * @param result - The result to check
 * @returns True if the result is Err
 */
export const isErr = (result) => result._tag === 'Err';
/**
 * Maps a function over the success value of a Result.
 * If the Result is Err, returns the Err unchanged.
 * @param fn - Function to apply to the success value
 * @returns A function that takes a Result and returns a new Result
 */
export const map = (fn) => (result) => isOk(result) ? ok(fn(result.value)) : result;
/**
 * Maps a function that returns a Result over the success value.
 * Flattens the nested Result. Also known as 'chain' or 'bind'.
 * @param fn - Function to apply to the success value
 * @returns A function that takes a Result and returns a new Result
 */
export const flatMap = (fn) => (result) => isOk(result) ? fn(result.value) : result;
/**
 * Maps a function over the error value of a Result.
 * If the Result is Ok, returns the Ok unchanged.
 * @param fn - Function to apply to the error value
 * @returns A function that takes a Result and returns a new Result
 */
export const mapErr = (fn) => (result) => isErr(result) ? err(fn(result.error)) : result;
/**
 * Extracts the value from a Result, or returns a default value if Err.
 * @param defaultValue - Value to return if Result is Err
 * @returns A function that takes a Result and returns the value
 */
export const getOrElse = (defaultValue) => (result) => isOk(result) ? result.value : defaultValue;
/**
 * Extracts the value from a Result, or computes a default from the error.
 * @param fn - Function to compute default from error
 * @returns A function that takes a Result and returns the value
 */
export const getOrElseW = (fn) => (result) => isOk(result) ? result.value : fn(result.error);
/**
 * Folds a Result into a single value by applying one of two functions.
 * @param onErr - Function to apply if Result is Err
 * @param onOk - Function to apply if Result is Ok
 * @returns A function that takes a Result and returns the folded value
 */
export const fold = (onErr, onOk) => (result) => isOk(result) ? onOk(result.value) : onErr(result.error);
/**
 * Wraps a function that might throw into one that returns a Result.
 * @param fn - Function that might throw
 * @returns A function that returns a Result
 */
export const tryCatch = (fn, onError) => {
    try {
        return ok(fn());
    }
    catch (e) {
        return err(onError(e));
    }
};
/**
 * Wraps an async function that might throw into one that returns a Promise<Result>.
 * @param fn - Async function that might throw
 * @param onError - Error mapper
 * @returns Promise of Result
 */
export const tryCatchAsync = async (fn, onError) => {
    try {
        return ok(await fn());
    }
    catch (e) {
        return err(onError(e));
    }
};
/**
 * Combines multiple Results into a single Result containing an array.
 * If any Result is Err, returns the first Err.
 * @param results - Array of Results
 * @returns Result containing array of values or first error
 */
export const sequence = (results) => {
    const values = [];
    for (const result of results) {
        if (isErr(result))
            return result;
        values.push(result.value);
    }
    return ok(values);
};
/**
 * Applies a function that returns a Result to each element of an array.
 * Collects all successes or returns the first error.
 * @param fn - Function to apply to each element
 * @returns A function that takes an array and returns a Result of array
 */
export const traverse = (fn) => (items) => sequence(R.map(fn, items));
/**
 * Converts a nullable value to a Result.
 * @param error - Error to use if value is null/undefined
 * @returns A function that takes a nullable and returns a Result
 */
export const fromNullable = (error) => (value) => value != null ? ok(value) : err(error);
//# sourceMappingURL=result.js.map