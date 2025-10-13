import fs from "fs";
import path from "path";

let loaded = false;

const searchRoots = [process.cwd(), path.resolve(process.cwd(), "../")];

function resolveCandidate(fileName: string) {
  if (path.isAbsolute(fileName)) {
    return [fileName];
  }

  return searchRoots.map((root) => path.resolve(root, fileName));
}

function applyEnv(envPath: string) {
  const contents = fs.readFileSync(envPath, "utf8");
  const lines = contents.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const delimiterIndex = line.indexOf("=");

    if (delimiterIndex === -1) {
      continue;
    }

    const key = line.slice(0, delimiterIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(delimiterIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

export function loadEnv() {
  if (loaded) {
    return;
  }

  const candidates: string[] = [];
  const explicitFile = process.env.ENV_FILE;
  if (explicitFile) {
    candidates.push(explicitFile);
  }

  if (process.env.NODE_ENV === "production") {
    candidates.push(".env.production");
  }

  candidates.push(".env");

  const visited = new Set<string>();

  for (const file of candidates) {
    for (const candidate of resolveCandidate(file)) {
      if (visited.has(candidate)) {
        continue;
      }
      visited.add(candidate);

      if (fs.existsSync(candidate)) {
        applyEnv(candidate);
        loaded = true;
        return;
      }
    }
  }

  loaded = true;
}

loadEnv();
