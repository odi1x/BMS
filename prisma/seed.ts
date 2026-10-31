import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  assertIntegrity,
  demoBuildings,
  demoContracts,
  demoExpenses,
  demoRevenues,
  demoUnits,
  demoUsers,
  demoUtilityBills,
} from "../src/lib/demo-data";
import { loadEnvIntoProcess } from "../scripts/load-env";

loadEnvIntoProcess();

const seedUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

const prisma = new PrismaClient(seedUrl ? { datasources: { db: { url: seedUrl } } } : undefined);
const DEMO_PASSWORD = "123456";

async function main() {
  assertIntegrity();

  const target = seedUrl ? new URL(seedUrl).host : "(default DATABASE_URL)";

  let existing = 0;
  try {
    existing = await prisma.building.count();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      console.error(`The database at ${target} has no application tables yet.`);
      console.error("Run `npm run db:setup` first.");
      process.exit(1);
    }
    throw error;
  }

  const confirmed =
    process.argv.includes("--yes") ||
    process.argv.includes("--force") ||
    process.env.SEED_CONFIRM === "1";

  if (existing > 0 && !confirmed) {
    console.error(`The database at ${target} already holds ${existing} building(s).`);
    console.error(
      "The seed replaces every row. Run `npm run db:seed -- --force` to go ahead.",
    );
    process.exit(1);
  }

  await prisma.revenue.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.utilityBill.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.building.deleteMany();

  for (const building of demoBuildings) {
    await prisma.building.create({
      data: {
        id: building.id,
        name: building.name,
        registrationNo: building.registrationNo,
        unifiedId: building.unifiedId,
        address: building.address,
        iban: building.iban,
        chairmanName: building.chairmanName,
        stampUrl: building.stampUrl,
        stampFileId: building.stampFileId,
      },
    });
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const user of demoUsers) {
    await prisma.profile.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash,
        avatarUrl: user.avatarUrl,
        role: user.role,
        buildingId: user.buildingId,
      },
    });
  }

  for (const unit of demoUnits) {
    await prisma.unit.create({
      data: {
        id: unit.id,
        buildingId: unit.buildingId,
        unitNumber: unit.unitNumber,
        floor: unit.floor,
        titleDeedNo: unit.titleDeedNo,
        hasParking: unit.hasParking,
        parkingCardNo: unit.parkingCardNo,
        electricityMeterNo: unit.electricityMeterNo,
        waterMeterNo: unit.waterMeterNo,
        ownerName: unit.ownerName,
        ownerPhone: unit.ownerPhone,
        tenantName: unit.tenantName,
        tenantPhone: unit.tenantPhone,
        rentalDeed: unit.rentalDeed,
        unitArea: unit.unitArea,
        annualFee: unit.annualFee,
        additionalFees: unit.additionalFees,
        photoUrl: unit.photoUrl,
      },
    });
  }

  for (const revenue of demoRevenues) {
    await prisma.revenue.create({
      data: {
        id: revenue.id,
        buildingId: revenue.buildingId,
        unitId: revenue.unitId,
        voucherNo: revenue.voucherNo,
        date: revenue.date,
        fiscalYear: revenue.fiscalYear,
        fiscalMonth: revenue.fiscalMonth,
        amount: revenue.amount,
        paymentChannel: revenue.paymentChannel,
        notes: revenue.notes,
      },
    });
  }

  for (const expense of demoExpenses) {
    await prisma.expense.create({
      data: {
        id: expense.id,
        buildingId: expense.buildingId,
        itemNo: expense.itemNo,
        category: expense.category,
        amount: expense.amount,
        fiscalYear: expense.fiscalYear,
        fiscalMonth: expense.fiscalMonth,
        notes: expense.notes,
      },
    });
  }

  for (const bill of demoUtilityBills) {
    await prisma.utilityBill.create({
      data: {
        id: bill.id,
        buildingId: bill.buildingId,
        type: bill.type,
        accountNo: bill.accountNo,
        meterNo: bill.meterNo,
        amount: bill.amount,
        paymentDate: bill.paymentDate,
        fiscalYear: bill.fiscalYear,
        fiscalMonth: bill.fiscalMonth,
      },
    });
  }

  for (const contract of demoContracts) {
    await prisma.contract.create({
      data: {
        id: contract.id,
        buildingId: contract.buildingId,
        title: contract.title,
        totalAmount: contract.totalAmount,
        itemCount: contract.itemCount,
        startDate: contract.startDate,
        endDate: contract.endDate,
        nextDueDate: contract.nextDueDate,
        balanceDue: contract.balanceDue,
        vendor: contract.vendor,
        paidAmount: contract.paidAmount,
        installment: contract.installment,
        paymentNote: contract.paymentNote,
      },
    });
  }

  console.log("تمت تعبئة قاعدة البيانات:");
  console.log(`- المضيف: ${target}`);
  console.log(`- ${demoBuildings.length} جمعيات`);
  console.log(`- ${demoUnits.length} شقق`);
  console.log(`- ${demoRevenues.length} سند قبض`);
  console.log(`- ${demoExpenses.length} بند مصروف`);
  console.log(`- ${demoUtilityBills.length} فاتورة خدمات`);
  console.log(`- ${demoContracts.length} عقد`);
  console.log(`- ${demoUsers.length} مستخدمين (كلمة المرور: ${DEMO_PASSWORD})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
