/**
 * @file src/testkit/fs.ts
 * @module testkit/fs
 * @summary Fs.
 */
// src/testkit/fs.ts
import { promises as fs } from "node:fs";
import * as fsSync from "node:fs";
import * as path from "node:path";

/**
 * Function pathExists.
 * @param p (required: string)
 * @returns Promise
 */
export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Function readJSON.
 * @param p (required: string)
 * @returns Promise
 */
export async function readJSON<T>(p: string): Promise<T> {
  const raw = await fs.readFile(p, "utf8");
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new Error(`Invalid JSON in ${p}: ${(e as Error).message}`);
  }
}

/**
 * Function listFiles.
 * @param p (required: string)
 * @returns Promise
 */
export async function listFiles(p: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(p);
    return entries.map((e) => path.join(p, e));
  } catch {
    return [];
  }
}

/**
 * Resolve the fixtures root, preferring src/testkit/... if it exists.
 * @returns string
 */
export function fixturesRoot(): string {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "src", "testkit", "__tests__", "fixtures"),
    path.join(cwd, "testkit", "__tests__", "fixtures"),
  ];

  for (const p of candidates) {
    try {
      fsSync.accessSync(p);
      return p;
    } catch {
      // continue
    }
  }
  // Default to src layout to keep relative paths stable in runner/specs.
  return candidates[0];
}

/**
 * Function endpointRoot.
 * @param version (required: string)
 * @param plan (required: string)
 * @param testkitlug (required: string)
 * @returns string
 */
export function endpointRoot(version: string, plan: string, testkitlug: string): string {
  return path.join(fixturesRoot(), version, plan, testkitlug);
}
