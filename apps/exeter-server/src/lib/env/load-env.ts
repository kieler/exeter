import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

export function loadEnv(environment: string | null): void {
  loadIfPresent(".env");
  loadIfPresent(environment ? `.env.${environment}` : ".env.local");
}

function loadIfPresent(path: string): void {
  if (existsSync(path)) {
    loadEnvFile(path);
  }
}
