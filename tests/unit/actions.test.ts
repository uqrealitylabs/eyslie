import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { findActionPinIssues } from "../../tools/scripts/assert-actions-pinned.ts";

test("allows the pinned solver without relaxing the workflow allowlist", () => {
  const directory = mkdtempSync(join(tmpdir(), "eyslie-workflows-"));
  const pin = `jobs:\n  check:\n    uses: owner/repo@${"a".repeat(40)}\n`;
  try {
    for (const name of [
      "checks.yml",
      "publish.yml",
      "release.yml",
      "security.yml",
    ]) {
      writeFileSync(join(directory, name), pin);
    }
    expect(findActionPinIssues(directory)).toEqual([]);
    writeFileSync(join(directory, "dependasolver.yml"), pin);
    expect(findActionPinIssues(directory)).toEqual([]);
    writeFileSync(
      join(directory, "dependasolver.yml"),
      pin.replace(/a{40}/, "main"),
    );
    expect(findActionPinIssues(directory).join()).toContain("not SHA-pinned");
    writeFileSync(join(directory, "dependasolver.yml"), pin);
    writeFileSync(join(directory, "unexpected.yml"), pin);
    expect(findActionPinIssues(directory).join()).toContain("must contain");
    unlinkSync(join(directory, "unexpected.yml"));
    unlinkSync(join(directory, "checks.yml"));
    expect(findActionPinIssues(directory).join()).toContain("must contain");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
