import { config } from "dotenv";
import fs from "fs";
import path from "path";

let loaded = false;

export function loadEnv() {
  if (loaded) {
    return;
  }

  const candidatePaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
  ];

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      config({ path: envPath });
      loaded = true;
      return;
    }
  }

  loaded = true;
}

loadEnv();
