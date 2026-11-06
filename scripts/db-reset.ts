import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadEnvIntoProcess } from "./load-env";

loadEnvIntoProcess();

const prisma = new PrismaClient();
const ADMIN_EMAIL = "omar_admin@rentflow.sa";
const ADMIN_PASSWORD = "omar1395";

async function main() {
  const confirmed =
    process.argv.includes("--yes") ||
    process.argv.includes("--force") ||
    process.env.RESET_CONFIRM === "1";

  const [buildings, units, revenues, expenses, bills, contracts, users] = await Promise.all([
    prisma.building.count(),
    prisma.unit.count(),
    prisma.revenue.count(),
    prisma.expense.count(),
    prisma.utilityBill.count(),
    prisma.contract.count(),
    prisma.profile.count(),
  ]);

  console.log("The database currently holds:");
  console.log(`  ${buildings} associations, ${units} units, ${revenues} vouchers`);
  console.log(`  ${expenses} expenses, ${bills} utility bills, ${contracts} contracts, ${users} users`);

  if (!confirmed) {
    console.error("\nThis deletes every row. Run `npm run db:reset -- --force` to go ahead.");
    process.exit(1);
  }

  await prisma.revenue.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.utilityBill.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.building.deleteMany();

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.profile.create({
    data: {
      email: ADMIN_EMAIL,
      name: "omar_admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("\nEverything was deleted.");
  console.log(`One admin account was kept so the app stays reachable: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
