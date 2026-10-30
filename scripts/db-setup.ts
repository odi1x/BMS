import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { formatFindings, hasErrors, inspectEnvironment, parseConnectionUrl } from "./env-check";
import { connectionUrls, grantRuntimeRole, loadEnvFile } from "./grant-runtime-role";

const PRISMA_CLI = "node_modules/prisma/build/index.js";

function prismaCommand(args: string[], env: Record<string, string>): number {
  const result = spawnSync(process.execPath, [PRISMA_CLI, ...args], {
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  return result.status ?? 1;
}

function isTransactionPooler(url: string): boolean {
  const parsed = parseConnectionUrl(url);
  return parsed !== null && parsed.host.endsWith(".pooler.supabase.com") && parsed.port === "6543";
}

async function main() {
  const { databaseUrl, directUrl } = connectionUrls();
  const env = { DATABASE_URL: databaseUrl, DIRECT_URL: directUrl };

  console.log("Step 1/4 — checking the configuration");
  const findings = inspectEnvironment({ ...loadEnvFile(), ...process.env });
  if (findings.length > 0) console.log(formatFindings(findings));
  if (hasErrors(findings)) {
    console.error("\nThe configuration has errors. Fix them and run this again.");
    process.exit(1);
  }

  console.log("\nStep 2/4 — inspecting the database");
  let migrationUrl = directUrl;
  let prisma = new PrismaClient({ datasources: { db: { url: migrationUrl } } });

  let tables: string[] = [];
  let trackedMigrations: string[] = [];

  try {
    const rows = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
      `select tablename from pg_tables where schemaname = 'public'`,
    );
    tables = rows.map((row) => row.tablename);

    if (tables.includes("_prisma_migrations")) {
      const applied = await prisma.$queryRawUnsafe<{ migration_name: string; finished_at: Date | null }[]>(
        `select migration_name, finished_at from _prisma_migrations order by started_at`,
      );
      trackedMigrations = applied
        .filter((row) => row.finished_at !== null)
        .map((row) => row.migration_name);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\nCould not connect to DIRECT_URL:\n${message}`);

    if (directUrl !== databaseUrl && !isTransactionPooler(databaseUrl)) {
      console.log("\nFalling back to DATABASE_URL for this run.");
      migrationUrl = databaseUrl;
      env.DIRECT_URL = databaseUrl;
      prisma = new PrismaClient({ datasources: { db: { url: migrationUrl } } });
      tables = [];
      trackedMigrations = [];

      const rows = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
        `select tablename from pg_tables where schemaname = 'public'`,
      );
      tables = rows.map((row) => row.tablename);
    } else {
      console.error(
        "\nCheck the connection strings. On Supabase the direct host (db.<ref>.supabase.co) is " +
          "IPv6 only: from an IPv4-only network use the session pooler string " +
          "(same pooler host, port 5432) as DIRECT_URL.",
      );
      await prisma.$disconnect();
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }

  const hasProfiles = tables.includes("profiles");
  const hasBuildingUser = tables.includes("BuildingUser");
  const dataTables = tables.filter(
    (name) => !name.startsWith("_prisma") && name !== "profiles" && name !== "BuildingUser",
  );

  console.log(`  public tables: ${tables.length ? tables.join(", ") : "(none)"}`);

  if (trackedMigrations.length > 0) {
    console.log(`  already tracked by Prisma: ${trackedMigrations.join(", ")}`);
  }

  console.log("\nStep 3/4 — applying migrations");
  if (trackedMigrations.length === 0) {
    if (hasBuildingUser) {
      console.log("  Database has the old identity table → baselining 0001_init");
      prismaCommand(["migrate", "resolve", "--applied", "0001_init"], env);
    } else if (hasProfiles) {
      console.log("  Database already has the new identity table → baselining every migration");
      prismaCommand(
        [
          "migrate",
          "resolve",
          "--applied",
          "0001_init",
          "--applied",
          "0002_identity_profiles",
          "--applied",
          "0003_row_level_security",
        ],
        env,
      );
    } else {
      console.log("  Database is empty → all migrations will run");
    }
  }

  const deploy = prismaCommand(["migrate", "deploy"], env);
  if (deploy !== 0) {
    console.error("\nMigrations failed. Nothing else was changed.");
    process.exit(deploy);
  }

  console.log("\nStep 4/4 — wiring the runtime role");
  await grantRuntimeRole();

  console.log("\nDone. Next:");
  console.log("  npm run db:seed       (optional: demo rows)");
  console.log("  npm run db:check-rls  (proves the isolation works)");
  if (dataTables.length > 0) {
    console.log("\nNote: your database already held data in these tables:");
    console.log(`  ${dataTables.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
