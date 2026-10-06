import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name: string) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return [path];
  });
}

describe("local-only runtime", () => {
  it("does not reference network, storage, or telemetry from the app", () => {
    const paths = [...files("src"), "index.html"].filter((path) => /\.(ts|tsx|html|css)$/.test(path));
    const banned = [/https?:\/\//, /\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /localStorage/, /sessionStorage/, /indexedDB/, /websocket/i];
    for (const path of paths) {
      const text = readFileSync(path, "utf8");
      for (const pattern of banned) {
        expect(text, `${path} matches ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});
