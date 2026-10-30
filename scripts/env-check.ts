export type EnvLevel = "error" | "warn" | "info";

export interface EnvFinding {
  level: EnvLevel;
  message: string;
}

export interface ParsedConnection {
  host: string;
  port: string;
  username: string;
  password: string;
  params: Record<string, string>;
}

const SPECIALS = /[#?/]/;

export function parseConnectionUrl(raw: string): ParsedConnection | null {
  try {
    const url = new URL(raw);
    const params: Record<string, string> = {};
    for (const [key, value] of url.searchParams) params[key.toLowerCase()] = value;
    return {
      host: url.hostname.toLowerCase(),
      port: url.port,
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      params,
    };
  } catch {
    return null;
  }
}

function rawPassword(raw: string): string {
  const authority = raw.slice(raw.indexOf("//") + 2).split("/")[0];
  const colon = authority.indexOf(":");
  if (colon === -1) return "";
  const at = authority.lastIndexOf("@");
  if (at === -1 || at < colon) return "";
  return authority.slice(colon + 1, at);
}

export function isPoolerHost(host: string): boolean {
  return host.endsWith(".pooler.supabase.com");
}

export function isSupabaseDirectHost(host: string): boolean {
  return host.endsWith(".supabase.co") && !isPoolerHost(host);
}

/**
 * Checks the two connection strings against the way Supabase actually works:
 * the shared pooler has its own user name and its own limits, and migrations
 * cannot run through it in transaction mode.
 */
export function inspectEnvironment(env: Record<string, string | undefined>): EnvFinding[] {
  const findings: EnvFinding[] = [];
  const databaseUrl = env.DATABASE_URL?.trim() ?? "";
  const directUrl = env.DIRECT_URL?.trim() ?? "";

  if (!databaseUrl) {
    findings.push({
      level: "error",
      message:
        "DATABASE_URL is empty. Copy .env.example to .env and paste the transaction pooler string from the Supabase dashboard.",
    });
    return findings;
  }

  const runtime = parseConnectionUrl(databaseUrl);
  if (!runtime) {
    findings.push({ level: "error", message: "DATABASE_URL is not a valid URL." });
    return findings;
  }

  if (!runtime.password) {
    findings.push({ level: "error", message: "DATABASE_URL has no password." });
  }

  const runtimeIsPooler = isPoolerHost(runtime.host);
  const runtimeIsTransactionPooler = runtimeIsPooler && runtime.port === "6543";

  if (runtimeIsTransactionPooler && !runtime.params.pgbouncer) {
    findings.push({
      level: "error",
      message:
        'DATABASE_URL points at the transaction pooler (6543) without pgbouncer=true. Prisma would fail with "prepared statement already exists".',
    });
  }

  if (runtimeIsTransactionPooler && !runtime.params.connection_limit) {
    findings.push({
      level: "warn",
      message:
        "DATABASE_URL has no connection_limit. The default pool (CPU cores x 2 + 1) can exceed Supabase's connection cap; connection_limit=5 is enough for this app.",
    });
  }

  if (runtimeIsPooler && runtime.username === "postgres") {
    findings.push({
      level: "error",
      message:
        "DATABASE_URL uses a pooler host with the plain \"postgres\" user. The shared pooler expects postgres.<PROJECT-REF>.",
    });
  }

  if (!runtimeIsPooler && runtime.port === "5432" && isSupabaseDirectHost(runtime.host)) {
    findings.push({
      level: "warn",
      message:
        "DATABASE_URL is a direct connection. Every Prisma connection then occupies one of the project's Postgres connections; use the pooler for runtime.",
    });
  }

  if (!directUrl) {
    findings.push({
      level: "warn",
      message:
        "DIRECT_URL is empty. The app runs without it, but Prisma CLI commands that touch the schema (migrate, studio) need it.",
    });
  } else {
    const direct = parseConnectionUrl(directUrl);
    if (!direct) {
      findings.push({ level: "error", message: "DIRECT_URL is not a valid URL." });
    } else if (isPoolerHost(direct.host) && direct.port === "6543") {
      findings.push({
        level: "error",
        message:
          "DIRECT_URL points at the transaction pooler. Migrations need a real Postgres session: use the direct connection (5432) or the session pooler (5432).",
      });
    } else if (isPoolerHost(direct.host) && direct.port !== "5432") {
      findings.push({
        level: "error",
        message: `DIRECT_URL uses an unsupported pooler port (${direct.port || "none"}). Use port 5432.`,
      });
    } else {
      const runtimePath = new URL(databaseUrl).pathname;
      const directPath = new URL(directUrl).pathname;
      if (runtimePath !== directPath) {
        findings.push({
          level: "warn",
          message: `DATABASE_URL points at ${runtimePath} while DIRECT_URL points at ${directPath}. They should be the same database.`,
        });
      }
    }
  }

  for (const [label, raw] of [
    ["DATABASE_URL", databaseUrl],
    ["DIRECT_URL", directUrl],
  ] as const) {
    if (!raw) continue;
    const password = rawPassword(raw);
    if (SPECIALS.test(password)) {
      findings.push({
        level: "warn",
        message: `${label} has an unencoded character in the password. Percent-encode it (for example @ → %40, # → %23).`,
      });
    }
  }

  const runtimeRole = env.DATABASE_RUNTIME_ROLE?.trim();
  if (!runtimeRole) {
    findings.push({
      level: "info",
      message: "DATABASE_RUNTIME_ROLE is empty; app_user is assumed by default.",
    });
  } else if (runtimeRole === "none") {
    findings.push({
      level: "warn",
      message:
        "DATABASE_RUNTIME_ROLE=none turns off database-level isolation. Keep app_user outside of a migration.",
    });
  }

  const secret = env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    findings.push({
      level: "warn",
      message:
        "SESSION_SECRET is missing or shorter than 32 characters. Session cookies are signed with it.",
    });
  }

  return findings;
}

export function formatFindings(findings: EnvFinding[]): string {
  const icon: Record<EnvLevel, string> = { error: "ERROR", warn: "warn ", info: "info " };
  return findings.map((finding) => `  ${icon[finding.level]} ${finding.message}`).join("\n");
}

export function hasErrors(findings: EnvFinding[]): boolean {
  return findings.some((finding) => finding.level === "error");
}
