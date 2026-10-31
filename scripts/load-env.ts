import { existsSync, readFileSync } from "node:fs";

export function loadEnvFile(): Record<string, string> {
  if (!existsSync(".env")) return {};
  const values: Record<string, string> = {};
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^["']/, "")
      .replace(/["']$/, "");
    values[key] = value;
  }
  return values;
}

/**
 * Puts the values from `.env` into the environment of the current process.
 * The Prisma CLI loads `.env` on its own, but the scripts started through tsx
 * have to do it themselves.
 */
export function loadEnvIntoProcess(): void {
  for (const [key, value] of Object.entries(loadEnvFile())) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
