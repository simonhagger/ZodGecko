// src/testkit/__tests__/fs.spec.ts
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fixturesRoot, listFiles, pathExists, readJSON } from "../fs.js";

// Local mock state we can tweak from tests
type FsMockState = {
  accessSyncThrowsOnce: boolean;
  readdirReject: boolean;
  accessReject: boolean;
  readFileReject: boolean;
  readFileData: Buffer | null;
  readdirData: string[] | null;
};

const defaultState: FsMockState = {
  accessSyncThrowsOnce: false,
  readdirReject: false,
  accessReject: false,
  readFileReject: false,
  readFileData: null,
  readdirData: null,
};

const state: FsMockState = { ...defaultState };

// ESM-safe module mock for node:fs using closure state (no spies, no import() types)
vi.mock("node:fs", () => {
  type PathLike = string | Buffer | URL;

  return {
    accessSync: (_p: PathLike, _mode?: number): void => {
      if (state.accessSyncThrowsOnce) {
        state.accessSyncThrowsOnce = false;
        throw new Error("nope");
      }
      // otherwise succeed
    },
    promises: {
      readdir: (_dir: PathLike, _opts?: unknown): Promise<string[]> => {
        if (state.readdirReject) return Promise.reject(new Error("boom"));
        if (state.readdirData) return Promise.resolve(state.readdirData);
        return Promise.resolve([]); // neutral
      },
      access: (_p: PathLike, _mode?: number): Promise<void> => {
        if (state.accessReject) return Promise.reject(new Error("no-access"));
        return Promise.resolve();
      },
      readFile: (_p: PathLike, _opts?: unknown): Promise<Buffer> => {
        if (state.readFileReject) return Promise.reject(new Error("bad"));
        if (state.readFileData) return Promise.resolve(state.readFileData);
        return Promise.resolve(Buffer.from("{}"));
      },
    },
  };
});

beforeEach((): void => {
  Object.assign(state, defaultState);
});

afterEach((): void => {
  vi.restoreAllMocks();
});

describe("fs helpers", () => {
  it("fixturesRoot: falls back from src/... to testkit/... when first path is inaccessible", (): void => {
    state.accessSyncThrowsOnce = true;

    const root = fixturesRoot();
    expect(root.endsWith(path.join("testkit", "__tests__", "fixtures"))).toBe(true);
  });

  it("listFiles: returns empty array when readdir throws", async (): Promise<void> => {
    state.readdirReject = true;

    const files = await listFiles("/does/not/matter");
    expect(files).toEqual([]);
  });

  it("pathExists: returns false when access throws", async (): Promise<void> => {
    state.accessReject = true;

    const ok = await pathExists("/nope");
    expect(ok).toBe(false);
  });

  it("readJSON: throws with helpful message when JSON is invalid", async (): Promise<void> => {
    state.readFileData = Buffer.from("{ this is not valid json }");

    await expect(readJSON<Record<string, unknown>>("/bad.json")).rejects.toThrow(
      /Invalid JSON in \/bad\.json/i,
    );
  });
  it("pathExists: returns true when access succeeds", async (): Promise<void> => {
    // default mock state already treats access as success
    const ok = await pathExists("/some/path");
    expect(ok).toBe(true);
  });

  it("readJSON: returns parsed object when file contents are valid JSON", async (): Promise<void> => {
    // expose the closure state from this spec’s fs mock
    // (this file already defines `state`; just set the buffer)
    state.readFileData = Buffer.from('{"ok":true}');
    const obj = await readJSON<{ ok: boolean }>("/good.json");
    expect(obj.ok).toBe(true);
    state.readFileData = null;
  });
  it("listFiles: returns only direct children, ignores deeper nested entries", async (): Promise<void> => {
    state.readdirData = ["a.json", "nested", "b.txt", "nested/child.json"];

    const files = await listFiles("/root");
    // Our implementation should only include direct entries a.json and b.txt
    // (exact formatting depends on your fs.ts; assert by inclusion)
    expect(files.some((f) => f.endsWith("a.json"))).toBe(true);
    expect(files.some((f) => f.endsWith("b.txt"))).toBe(true);
    expect(files.some((f) => f.includes("nested/child.json"))).toBe(false);

    state.readdirData = null;
  });
});
