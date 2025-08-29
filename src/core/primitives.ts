/**
 * @file src/core/primitives.ts
 * @module core/primitives
 *
 * Zod primitives and brand utilities used across the library.
 * - Keep generic, framework-agnostic scalars here (ISODateTime, UrlString, brand, etc.).
 * - Domain-specific enums/fragments belong in `core/common.ts`.
 */
import { z } from "zod";

/** ISO-8601 date-time string (e.g., 2024-03-14T12:34:56Z). */
export const ISODateTime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
    "Expected an ISO-8601 UTC datetime like 2024-01-01T00:00:00Z or 2024-01-01T00:00:00+00:00",
  )
  .describe("ISO-8601 UTC datetime");

/** dd-mm-yyyy date string used by /history */
export const DdMmYyyy = z
  .string()
  .regex(/^(0?[1-9]|[12][0-9]|3[01])-(0?[1-9]|1[0-2])-\d{4}$/)
  .describe("Date formatted as dd-mm-yyyy for /history");

/**
 * HttpUrl — accepts only http(s) URLs.
 * CoinGecko often returns empty strings; we map "" -> undefined and make it optional.
 * (Replacement for deprecated .url() in Zod v4)
 */
const HttpUrl = z
  .string()
  .trim()
  .regex(/^https?:\/\/\S+$/i, "Expected an http(s) URL");

/**
 * UrlString — accepts only http(s) URLs or empty strings.
 * CoinGecko often returns empty strings; we map "" -> undefined and make it optional.
 * (Replacement for deprecated .url() in Zod v4)
 */
export const UrlString = HttpUrl.or(z.literal("")) // tolerate empty string from API
  .transform((s) => (s === "" ? undefined : s))
  .optional();

/** Non-empty string */
export const NonEmptyString = z.string().min(1);

/** Nullable string */
export const NullableString = z.string().nullable();

/** Default true boolean */
export const DefaultTrueBoolean = z.boolean().default(true);

/** Default false boolean */
export const DefaultFalseBoolean = z.boolean().default(false);

/** Number that may arrive as string; coerced to number */
export const CoercedNumber = z.preprocess(
  (v) => (typeof v === "string" ? Number(v) : v),
  z.number(),
);

/** Number that may be null */
export const NullableNumber = z.number().nullable();

/** Vs Quote (number) that may be null */
export const VsQuote = z.record(z.string(), z.number().nullable());

/** Vs Quote (string) that may be null */
export const VsQuoteString = z.record(z.string(), z.string().nullable());

/** Create a nominal (branded) type on top of a Zod schema. */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/** Create a branded type on top of a Zod schema. Identify a string by it's brand */
export const brand = <T, B extends string>(
  schema: z.ZodType<T>,
  _brand: B,
): z.ZodType<Brand<T, B>> => schema as z.ZodType<Brand<T, B>>;
