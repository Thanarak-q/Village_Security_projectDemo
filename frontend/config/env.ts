import fs from "fs";
import path from "path";

let loaded = false;

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

  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      applyEnv(candidate);
      loaded = true;
      return;
    }
  }

  loaded = true;
}

loadEnv();
