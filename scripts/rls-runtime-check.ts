import { prisma } from "@/lib/db";
import { withTenant } from "@/lib/db/tenant";
import type { SessionUser } from "@/lib/types";
import { loadEnvIntoProcess } from "./load-env";

loadEnvIntoProcess();

let failures = 0;

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    console.log(`  ok   ${name}`);
    return;
  }
  failures += 1;
  console.log(`  FAIL ${name} ${detail}`);
}

async function main() {
  const profiles = await prisma.profile.findMany({
    select: { id: true, email: true, role: true, buildingId: true },
    orderBy: { role: "asc" },
  });

  const admin = profiles.find((profile) => profile.role === "ADMIN");
  const user = profiles.find((profile) => profile.role === "USER");

  if (!admin || !user || !user.buildingId) {
    console.log("Seeded users are missing. Run `npm run db:seed` first.");
    process.exit(1);
  }

  const adminContext: SessionUser = {
    id: admin.id,
    email: admin.email,
    name: admin.email,
    role: "ADMIN",
    buildingId: admin.buildingId,
  };

  const userContext: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.email,
    role: "USER",
    buildingId: user.buildingId,
  };

  console.log(`admin: ${admin.email}`);
  console.log(`user:  ${user.email} → ${user.buildingId}`);

  const privilegedUnits = await prisma.unit.findMany({ select: { id: true, buildingId: true } });
  const userUnits = await withTenant(userContext, (tx) =>
    tx.unit.findMany({ select: { id: true, buildingId: true } }),
  );
  const adminUnits = await withTenant(adminContext, (tx) =>
    tx.unit.findMany({ select: { id: true, buildingId: true } }),
  );

  check(
    "the tenant sees rows",
    userUnits.length > 0,
    `got ${userUnits.length}`,
  );
  check(
    "the tenant sees only its own building",
    userUnits.every((unit) => unit.buildingId === user.buildingId),
    JSON.stringify([...new Set(userUnits.map((unit) => unit.buildingId))]),
  );
  check(
    "the privileged connection sees more than the tenant",
    privilegedUnits.length > userUnits.length,
    `privileged ${privilegedUnits.length} vs tenant ${userUnits.length}`,
  );
  check(
    "the admin sees every building",
    adminUnits.length === privilegedUnits.length,
    `admin ${adminUnits.length} vs privileged ${privilegedUnits.length}`,
  );

  const foreignBuilding = privilegedUnits.find((unit) => unit.buildingId !== user.buildingId);
  if (foreignBuilding) {
    let blocked = false;
    try {
      await withTenant(userContext, (tx) =>
        tx.unit.create({
          data: {
            id: "rls-probe",
            buildingId: foreignBuilding.buildingId,
            unitNumber: "999",
          },
        }),
      );
    } catch {
      blocked = true;
    }
    check("a cross-tenant insert is rejected", blocked);
  }

  let promoted = false;
  try {
    await withTenant(userContext, (tx) =>
      tx.profile.update({ where: { id: user.id }, data: { role: "ADMIN" } }),
    );
    promoted = true;
  } catch {
    promoted = false;
  }
  check("a user cannot promote itself to ADMIN", !promoted);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
    process.exit(failures === 0 ? 0 : 1);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
