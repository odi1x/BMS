import { PrismaClient } from "@prisma/client";
import { loadEnvFile } from "./load-env";

export { loadEnvFile };

export function connectionUrls(): { databaseUrl: string; directUrl: string } {
  const env = { ...loadEnvFile(), ...process.env };
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Copy .env.example to .env and fill it in first.");
  }
  const directUrl = env.DIRECT_URL ?? databaseUrl;

  // The Prisma CLI resolves both variables from the environment, so the values
  // read from .env have to be visible to it as well.
  process.env.DATABASE_URL = databaseUrl;
  process.env.DIRECT_URL = directUrl;

  return { databaseUrl, directUrl };
}

/**
 * Lets the connection role assume `app_user`, the non-owning role the Row
 * Level Security policies are written for. Without it the table owner would
 * skip the policies entirely.
 */
export async function grantRuntimeRole(): Promise<void> {
  const { databaseUrl, directUrl } = connectionUrls();
  const runtimeUser = decodeURIComponent(new URL(databaseUrl).username);
  const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

  try {
    const runtimeRole = await prisma.$queryRawUnsafe<{ rolname: string; rolbypassrls: boolean }[]>(
      `select rolname, rolbypassrls from pg_roles where rolname = $1`,
      runtimeUser,
    );

    if (runtimeRole.length === 0) {
      console.log(
        `The runtime user "${runtimeUser}" is not a Postgres role on this server ` +
          "(Supabase's pooler maps it to the owner). Granting app_user to the owner instead.",
      );
      await prisma.$executeRawUnsafe(`grant app_user to current_user`);
    } else {
      await prisma.$executeRawUnsafe(`grant app_user to "${runtimeUser.replace(/"/g, '""')}"`);
      console.log(`Granted app_user to "${runtimeUser}".`);
      if (runtimeRole[0].rolbypassrls) {
        console.log(
          "The connection role can bypass RLS on its own, but every query runs inside a " +
            "transaction that switches to app_user, so the policies still apply.",
        );
      }
    }

    const members = await prisma.$queryRawUnsafe<{ member: string; bypassrls: boolean }[]>(
      `select distinct m.rolname as member, m.rolbypassrls as bypassrls
         from pg_auth_members am
         join pg_roles r on r.oid = am.roleid
         join pg_roles m on m.oid = am.member
        where r.rolname = 'app_user'`,
    );

    console.log("Roles that can assume app_user:");
    for (const member of members) {
      console.log(`  - ${member.member}${member.bypassrls ? " (BYPASSRLS)" : ""}`);
    }

    const check =
      runtimeRole.length === 0
        ? await prisma.$queryRawUnsafe<{ can: boolean }[]>(
            `select pg_has_role(current_user::name, 'app_user'::name, 'MEMBER'::text) as can`,
          )
        : await prisma.$queryRawUnsafe<{ can: boolean }[]>(
            `select pg_has_role($1::name, 'app_user'::name, 'MEMBER'::text) as can`,
            runtimeUser,
          );

    console.log(
      check[0]?.can
        ? "The runtime connection can assume app_user, so the policies apply to every query."
        : "The runtime connection cannot assume app_user. Run `npm run db:grant` as the database owner.",
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const { databaseUrl, directUrl } = connectionUrls();
  console.log(`runtime user: ${decodeURIComponent(new URL(databaseUrl).username)}`);

  const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });
  try {
    const appUser = await prisma.$queryRawUnsafe<{ rolname: string }[]>(
      `select rolname from pg_roles where rolname = 'app_user'`,
    );
    if (appUser.length === 0) {
      console.log("app_user does not exist yet. Run `npm run db:deploy` first.");
      return;
    }
  } finally {
    await prisma.$disconnect();
  }

  await grantRuntimeRole();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
