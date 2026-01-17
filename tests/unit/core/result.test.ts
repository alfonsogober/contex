import { describe, it, expect } from 'vitest';
import {
  ok,
  err,
  isOk,
  isErr,
  map,
  flatMap,
  mapErr,
  getOrElse,
  getOrElseW,
  fold,
  tryCatch,
  tryCatchAsync,
  sequence,
  traverse,
  fromNullable,
} from '../../../src/core/result.js';

describe('Result monad', () => {
  describe('ok', () => {
    it('creates an Ok result with the given value', () => {
      const result = ok(42);
      expect(result._tag).toBe('Ok');
      expect(result.value).toBe(42);
    });
  });

  describe('err', () => {
    it('creates an Err result with the given error', () => {
      const result = err('error message');
      expect(result._tag).toBe('Err');
      expect(result.error).toBe('error message');
    });
  });

  describe('isOk', () => {
    it('returns true for Ok results', () => {
      expect(isOk(ok(1))).toBe(true);
    });

    it('returns false for Err results', () => {
      expect(isOk(err('error'))).toBe(false);
    });
  });

  describe('isErr', () => {
    it('returns true for Err results', () => {
      expect(isErr(err('error'))).toBe(true);
    });

    it('returns false for Ok results', () => {
      expect(isErr(ok(1))).toBe(false);
    });
  });

  describe('map', () => {
    it('applies function to Ok value', () => {
      const result = map((x: number) => x * 2)(ok(21));
      expect(isOk(result) && result.value).toBe(42);
    });

    it('preserves Err unchanged', () => {
      const result = map((x: number) => x * 2)(err('error'));
      expect(isErr(result) && result.error).toBe('error');
    });
  });

  describe('flatMap', () => {
    it('chains Ok results', () => {
      const result = flatMap((x: number) => ok(x * 2))(ok(21));
      expect(isOk(result) && result.value).toBe(42);
    });

    it('short-circuits on Err', () => {
      const result = flatMap((x: number) => ok(x * 2))(err('error'));
      expect(isErr(result) && result.error).toBe('error');
    });

    it('propagates inner Err', () => {
      const result = flatMap((_: number) => err('inner error'))(ok(21));
      expect(isErr(result) && result.error).toBe('inner error');
    });
  });

  describe('mapErr', () => {
    it('applies function to Err value', () => {
      const result = mapErr((e: string) => e.toUpperCase())(err('error'));
      expect(isErr(result) && result.error).toBe('ERROR');
    });

    it('preserves Ok unchanged', () => {
      const result = mapErr((e: string) => e.toUpperCase())(ok(42));
      expect(isOk(result) && result.value).toBe(42);
    });
  });

  describe('getOrElse', () => {
    it('returns value for Ok', () => {
      expect(getOrElse(0)(ok(42))).toBe(42);
    });

    it('returns default for Err', () => {
      expect(getOrElse(0)(err('error'))).toBe(0);
    });
  });

  describe('getOrElseW', () => {
    it('returns value for Ok', () => {
      expect(getOrElseW(() => 'default')(ok(42))).toBe(42);
    });

    it('computes default from error for Err', () => {
      expect(getOrElseW((e: string) => `fallback: ${e}`)(err('oops'))).toBe('fallback: oops');
    });
  });

  describe('fold', () => {
    it('applies onOk for Ok results', () => {
      const result = fold(
        (e: string) => `error: ${e}`,
        (v: number) => `value: ${v}`
      )(ok(42));
      expect(result).toBe('value: 42');
    });

    it('applies onErr for Err results', () => {
      const result = fold(
        (e: string) => `error: ${e}`,
        (v: number) => `value: ${v}`
      )(err('oops'));
      expect(result).toBe('error: oops');
    });
  });

  describe('tryCatch', () => {
    it('returns Ok for successful execution', () => {
      const result = tryCatch(
        () => 42,
        (e) => String(e)
      );
      expect(isOk(result) && result.value).toBe(42);
    });

    it('returns Err for thrown exceptions', () => {
      const result = tryCatch(
        () => { throw new Error('boom'); },
        (e) => (e as Error).message
      );
      expect(isErr(result) && result.error).toBe('boom');
    });
  });

  describe('tryCatchAsync', () => {
    it('returns Ok for successful async execution', async () => {
      const result = await tryCatchAsync(
        async () => 42,
        (e) => String(e)
      );
      expect(isOk(result) && result.value).toBe(42);
    });

    it('returns Err for rejected promises', async () => {
      const result = await tryCatchAsync(
        async () => { throw new Error('async boom'); },
        (e) => (e as Error).message
      );
      expect(isErr(result) && result.error).toBe('async boom');
    });
  });

  describe('sequence', () => {
    it('combines array of Ok results', () => {
      const results = [ok(1), ok(2), ok(3)];
      const combined = sequence(results);
      expect(isOk(combined) && combined.value).toEqual([1, 2, 3]);
    });

    it('returns first Err', () => {
      const results = [ok(1), err('first'), ok(3), err('second')];
      const combined = sequence(results);
      expect(isErr(combined) && combined.error).toBe('first');
    });

    it('handles empty array', () => {
      const combined = sequence([]);
      expect(isOk(combined) && combined.value).toEqual([]);
    });
  });

  describe('traverse', () => {
    it('maps and sequences in one operation', () => {
      const result = traverse((x: number) => ok(x * 2))([1, 2, 3]);
      expect(isOk(result) && result.value).toEqual([2, 4, 6]);
    });

    it('returns first Err from mapping', () => {
      const result = traverse((x: number) =>
        x === 2 ? err('bad number') : ok(x * 2)
      )([1, 2, 3]);
      expect(isErr(result) && result.error).toBe('bad number');
    });
  });

  describe('fromNullable', () => {
    it('returns Ok for non-null values', () => {
      const result = fromNullable('was null')(42);
      expect(isOk(result) && result.value).toBe(42);
    });

    it('returns Err for null', () => {
      const result = fromNullable('was null')(null);
      expect(isErr(result) && result.error).toBe('was null');
    });

    it('returns Err for undefined', () => {
      const result = fromNullable('was undefined')(undefined);
      expect(isErr(result) && result.error).toBe('was undefined');
    });
  });
});
