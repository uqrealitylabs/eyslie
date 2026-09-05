import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const workflowRoot = ".github/workflows";
const expectedWorkflows = [
  "checks.yml",
  "publish.yml",
  "release.yml",
  "security.yml",
];
const shaRef = /^[a-f0-9]{40}$/i;

function workflowFiles(root = workflowRoot) {
  return readdirSync(root)
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .map((file) => join(root, file));
}

export function findActionPinIssues(root = workflowRoot) {
  const issues: string[] = [];
  const files = workflowFiles(root);

  const actual = files
    .map((file) => file.slice(root.length + 1))
    .filter((file) => file !== "dependasolver.yml")
    .sort();
  if (actual.join() !== expectedWorkflows.join()) {
    issues.push(
      `${root} must contain: ${expectedWorkflows.join(", ")}; only dependasolver.yml is optional`,
    );
  }

  for (const file of files) {
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .forEach((line, index) => {
        const match = line.match(/\buses:\s*([^#\s]+)(?:\s*#\s*(.*))?/);
        if (!match) return;

        const action = match[1];
        if (action.startsWith("./")) return;

        const ref = action.split("@")[1];
        if (!ref) {
          issues.push(`${file}:${index + 1} missing action ref`);
          return;
        }

        if (!shaRef.test(ref)) {
          issues.push(`${file}:${index + 1} ${action} is not SHA-pinned`);
        }
      });
  }

  return issues;
}

if (process.argv[1]?.endsWith("assert-actions-pinned.ts")) {
  const issues = findActionPinIssues();
  if (issues.length > 0) {
    console.error(issues.join("\n"));
    process.exit(1);
  }
  console.log("Workflow layout and action pins are valid.");
}
