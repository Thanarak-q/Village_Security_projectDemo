import { config } from "dotenv";
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

export function loadEnv() {
  if (loaded) {
    return;
  }

  const candidates: string[] = [];
  const explicitFile = process.env.ENV_FILE;
  if (explicitFile) {
    candidates.push(explicitFile);
  }

  const env = process.env.NODE_ENV;
  if (env === "production") {
    candidates.push(".env.production");
  }

  candidates.push(".env");

  const visited = new Set<string>();

  for (const file of candidates) {
    for (const candidatePath of resolveCandidate(file)) {
      if (visited.has(candidatePath)) {
        continue;
      }
      visited.add(candidatePath);

      if (fs.existsSync(candidatePath)) {
        config({ path: candidatePath });
        loaded = true;
        return;
      }
    }
  }

  loaded = true;
}

loadEnv();
