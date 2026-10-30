import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

export type TenantContext = SessionUser;

const RUNTIME_ROLE = process.env.DATABASE_RUNTIME_ROLE ?? "app_user";

type ModelOperations = Record<string, (args: object) => Promise<unknown>>;

/**
 * Claims are the identity Postgres reads inside the Row Level Security policies.
 * `sub` is the profile id, `app_metadata` carries the role and the tenant key.
 */
export function claimsFor(context: TenantContext): string {
  return JSON.stringify({
    sub: context.id,
    email: context.email,
    role: "authenticated",
    app_metadata: {
      role: context.role,
      building_id: context.buildingId,
    },
  });
}

/**
 * Runs a query as the caller: the transaction carries the claims, and the
 * session role is switched to the non-owning `app_user` so the policies apply
 * instead of being skipped by the table owner.
 */
export async function withTenant<T>(
  context: TenantContext,
  run: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`select set_config('request.jwt.claims', ${claimsFor(context)}, true)`;

    if (RUNTIME_ROLE !== "none") {
      try {
        await tx.$queryRaw`select set_config('role', ${RUNTIME_ROLE}, true)`;
      } catch {
        throw new Error(
          `DATABASE_RUNTIME_ROLE "${RUNTIME_ROLE}" cannot be assumed by the database role. ` +
            "Apply prisma/migrations/0003_row_level_security, grant that role to the connection " +
            "role, or set DATABASE_RUNTIME_ROLE=none to run without database-level isolation.",
        );
      }
    }

    return run(tx);
  });
}

function runModelOperation(
  tx: Prisma.TransactionClient,
  model: string,
  operation: string,
  args: object,
): Promise<unknown> {
  const delegate = (tx as unknown as Record<string, ModelOperations>)[model];
  const execute = delegate?.[operation];
  if (!execute) {
    throw new Error(`Unsupported database operation ${operation} on ${model}.`);
  }
  return execute(args);
}

/**
 * Prisma client bound to one caller. Every model operation runs inside a
 * transaction that carries the session claims and assumes the non-owning
 * runtime role, so the Row Level Security policies decide what is reachable.
 */
export function tenantDb(context: TenantContext) {
  return prisma.$extends({
    name: "tenant-rls",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args }) {
          return withTenant(context, (tx) =>
            runModelOperation(tx, model, operation, args as object),
          );
        },
      },
    },
  });
}
