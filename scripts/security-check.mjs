// Read-only local audit. Prints names/counts, never credentials or transcript text.
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { join, resolve, relative, extname, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";

const root = process.cwd();
const failures = [],
  notices = [];
const excluded = new Set([
  "node_modules",
  ".next",
  ".git",
  ".data",
  "output",
  "tmp",
  "backups",
  ".playwright-cli",
  ".npm-cache",
  ".cache",
  ".codex",
  ".aws",
  ".ssh",
  ".venv",
  ".turbo",
  ".vercel",
]);
const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".css",
  ".html",
  ".map",
  ".toml",
  ".txt",
]);
function walk(directory, skipPrivate = true) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
    if (item.isSymbolicLink()) return [];
    const path = join(directory, item.name);
    if (item.isDirectory())
      return skipPrivate &&
        (excluded.has(item.name) ||
          item.name.startsWith(".venv-") ||
          item.name === "__pycache__")
        ? []
        : walk(path, skipPrivate);
    return [path];
  });
}
const env = new Map();
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    )
      value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, "");
    env.set(match[1], value);
  }
}
const secrets = [...env].filter(
  ([key, value]) =>
    /SECRET|TOKEN|API_KEY|PASSWORD|PRIVATE_KEY/.test(key) && value.length >= 16,
);
for (const [key] of secrets)
  if (key.startsWith("NEXT_PUBLIC_"))
    failures.push(`Public environment variable has a secret-like name: ${key}`);

const patterns = [
  ["OpenAI-style API key", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}\b/],
  [
    "private key",
    /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,
  ],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  [
    "GitHub token",
    /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/,
  ],
  [
    "JWT-like token",
    /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
  ],
];
const sourceFiles = walk(root).filter(
  (path) =>
    !relative(root, path)
      .split(/[\\/]/)
      .some((part) => part.startsWith(".env") && part !== ".env.example") &&
    (textExtensions.has(extname(path)) ||
      ["Dockerfile", ".gitignore", ".dockerignore"].includes(
        relative(root, path),
      )),
);
for (const path of sourceFiles) {
  if (statSync(path).size > 4 * 1024 * 1024) {
    notices.push(`Skipped large source file: ${relative(root, path)}`);
    continue;
  }
  const content = readFileSync(path, "utf8");
  for (const [name, pattern] of patterns)
    if (pattern.test(content))
      failures.push(`Potential ${name}: ${relative(root, path)}`);
  for (const [key, value] of secrets)
    if (content.includes(value))
      failures.push(
        `Local secret value appears in source (${key}): ${relative(root, path)}`,
      );
}
let clientFiles = 0;
for (const path of walk(join(root, ".next", "static"), false)) {
  if (![".js", ".map", ".json", ".css", ".html"].includes(extname(path)))
    continue;
  clientFiles++;
  const content = readFileSync(path, "utf8");
  for (const [key, value] of secrets)
    if (content.includes(value))
      failures.push(
        `Local secret value appears in browser bundle (${key}): ${relative(root, path)}`,
      );
}

const privateSamples = [
  ".env.local",
  ".env.production",
  ".data/opic.sqlite",
  ".data/opic.sqlite-wal",
  ".data/opic.sqlite-shm",
  ".data/audio/recording.webm",
  ".data/session-key",
  ".data/chatgpt-host-id",
  "output/tests/opic.sqlite",
  "output/playwright/screenshot.png",
  "tmp/pdfs/page.png",
  ".playwright-cli/state.json",
  "backups/exam.json",
  "opic_guide.pdf",
  "private.pem",
  "private.key",
  "debug.log",
  ".venv-audio/model.bin",
];
const scratch = mkdtempSync(join(tmpdir(), "opic-ignore-audit-"));
try {
  const init = spawnSync("git", ["init", "--quiet", scratch], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (init.status !== 0) {
    failures.push("Git is needed to verify ignore rules.");
  } else {
    writeFileSync(join(scratch, ".gitignore"), readFileSync(".gitignore"));
    const check = spawnSync(
      "git",
      ["-C", scratch, "check-ignore", "--no-index", "--stdin"],
      {
        input:
          [...privateSamples, ".env.example", "README.md"].join("\n") + "\n",
        encoding: "utf8",
        windowsHide: true,
      },
    );
    const ignored = new Set(check.stdout.trim().split(/\r?\n/));
    for (const path of privateSamples)
      if (!ignored.has(path))
        failures.push(`Missing Git ignore coverage: ${path}`);
    for (const path of [".env.example", "README.md"])
      if (ignored.has(path))
        failures.push(
          `Public template/document is unexpectedly ignored: ${path}`,
        );
  }
} finally {
  if (
    !resolve(scratch).startsWith(resolve(tmpdir()) + sep) ||
    !relative(tmpdir(), scratch).startsWith("opic-ignore-audit-")
  )
    throw new Error("Unexpected audit scratch path");
  rmSync(scratch, { recursive: true, force: true });
}

const repo = spawnSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
  windowsHide: true,
});
const gitReady =
  repo.status === 0 && resolve(repo.stdout.trim()) === resolve(root);
if (gitReady) {
  const tracked = spawnSync("git", ["ls-files", "-z"], {
    encoding: "utf8",
    windowsHide: true,
  })
    .stdout.split("\0")
    .filter(Boolean);
  for (const path of tracked)
    if (
      /^(?:\.data|output|tmp|backups|\.playwright-cli|\.aws|\.ssh|\.codex)\//.test(
        path,
      ) ||
      /(?:^|\/)\.env(?!\.example$)/.test(path) ||
      /\.(?:sqlite(?:3)?(?:-wal|-shm)?|db|pem|key|p12|pfx)$/.test(path) ||
      path === "opic_guide.pdf"
    )
      failures.push(`Sensitive/private file is already tracked: ${path}`);
} else
  notices.push(
    "This folder is not a Git repository; tracked files and commit history could not be audited.",
  );

const localFiles = [
  ".env.local",
  ".data/opic.sqlite",
  ".data/opic.sqlite-wal",
  ".data/opic.sqlite-shm",
  ".data/session-key",
  ".data/chatgpt-host-id",
  "opic_guide.pdf",
];
const present = localFiles.filter((path) => existsSync(path));
const audioCount = walk(join(root, ".data", "audio"), false).length;
let records = null;
if (existsSync(".data/opic.sqlite")) {
  const database = new DatabaseSync(resolve(".data/opic.sqlite"), {
    readOnly: true,
  });
  try {
    records = Object.fromEntries(
      ["users", "exams", "connections", "oauth_transactions"].map((table) => [
        table,
        database.prepare(`SELECT count(*) AS n FROM ${table}`).get().n,
      ]),
    );
    records.storedCredentials = database
      .prepare(
        "SELECT count(*) AS n FROM connections WHERE credentials IS NOT NULL",
      )
      .get().n;
  } finally {
    database.close();
  }
}
if (env.get("DATA_DIR") && resolve(env.get("DATA_DIR")) !== resolve(".data"))
  notices.push(
    "A custom DATA_DIR is configured. This audit inventories the default .data only; inspect the custom storage separately.",
  );

console.log(
  JSON.stringify(
    {
      sourceFilesScanned: sourceFiles.length,
      browserFilesScanned: clientFiles,
      gitRepository: gitReady,
      localPrivateFilesPresent: present,
      localAudioFiles: audioCount,
      localDatabaseCounts: records,
      configuredSecretNames: secrets.map(([key]) => key),
      gitIgnoreSamplesChecked: privateSamples.length,
      findings: [...new Set(failures)],
      notices,
      scope:
        "Pattern and current-local-secret checks only; no token values, identities, transcripts, recordings or historical commits are printed. No files or records are deleted.",
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
