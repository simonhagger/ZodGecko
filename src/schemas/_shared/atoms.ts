/**
 * @file src/schemas/_shared/atoms.ts
 * @module schemas/_shared/atoms
 *
 * Zod primitives and brand utilities used across the library.
 * - Keep generic, framework-agnostic scalars here (ISODateTime, UrlString, brand, etc.).
 * - Domain-specific enums/fragments belong in `schemas/_shared/common.ts`.
  * @summary Atoms.
 */
import { z } from "zod";

/**
 * Basic types with variant rules
 */

/** STRINGS */

/** StringLike: will attempt to coerce to string, naively. */
export const StringLike = z.coerce.string();

/** CoercedNumberToString: is for a string that may arrive as number, very specific exclusion of other types. */
export const CoercedNumberToString = z.preprocess(
  (v) => (typeof v === "number" ? String(v) : v),
  z.string(),
);

/** NonEmptyString: string that when trimmed still has a minimum length of 1. */
export const NonEmptyString = z.string().trim().min(1);

/** OptionalString: string that is optional */
export const OptionalString = z.string().optional();

/** NullableString: string that is nullable */
export const NullableString = z.string().nullable();

/** NullishString: string that is nullish (allows undefined or null) makes a result accept null and optional */
export const NullishString = z.string().nullish();

/** BOOLEANS */

/** BooleanLike: will attempt to coerce to boolean, naively. */
export const BooleanLike = z.coerce.boolean();

/** DefaultTrueBoolean: boolean that defaults to true */
export const DefaultTrueBoolean = z.boolean().default(true);

/** DefaultFalseBoolean: boolean that defaults to false */
export const DefaultFalseBoolean = z.boolean().default(false);

/** OptionalBoolean: boolean that is optional */
export const OptionalBoolean = z.boolean().optional();

/** NullishBoolean: boolean that is nullish (allows undefined or null) makes a result accept null and optional */
export const NullishBoolean = z.boolean().nullish();

/** NUMBERS */

/** NumberLike: will attempt to coerce to number, naively. */
export const NumberLike = z.coerce.number();

/** CoercedStringToNumber: is for a number that may arrive as string, very specific exclusion of other types. */
export const CoercedStringToNumber = z.preprocess(
  (v) => (typeof v === "string" ? Number(v) : v),
  z.number(),
);

/** PositiveNumber: number with a positive value */
export const PositiveNumber = z.number().positive();

/** NegativeNumber: number with a negative value */
export const NegativeNumber = z.number().positive();

/** NullableNumber: number that may be null */
export const NullableNumber = z.number().nullable();

/** OptionalNumber: number that isoptional */
export const OptionalNumber = z.number().optional();

/** NullishNumber: number that may be nullish (allows undefined or null) makes a result accept null and optional */
export const NullishNumber = z.number().nullish();

/**
 * More customised Zod structures
 */

/** DATE RELATED */

/** ISO-8601 date-time string (e.g., 2024-03-14T12:34:56Z). Allows for offset variants. */
export const ISODateTime = z.iso.datetime({ offset: true });

/** dd-mm-yyyy date string used by /history */
export const DdMmYyyy = z
  .string()
  .regex(/^(0?[1-9]|[12][0-9]|3[01])-(0?[1-9]|1[0-2])-\d{4}$/)
  .describe("Date formatted as dd-mm-yyyy for /history");

/**
 * UrlStringOrUndefined — accepts only http(s) URLs or empty strings.
 * CoinGecko often returns empty strings; we map "" -> undefined.
 */
export const UrlStringOrUndefined = z
  .url({
    protocol: /^(http|https)?$/,
    hostname: z.regexes.domain,
  })
  .or(z.literal("")) // tolerate empty string from API
  .transform((s) => (s === "" ? undefined : s));
