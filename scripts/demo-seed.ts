import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadEnvIntoProcess } from "./load-env";

loadEnvIntoProcess();

const prisma = new PrismaClient();

const AR_FIRST = [
  "أحمد",
  "محمد",
  "علي",
  "حسن",
  "حسين",
  "إبراهيم",
  "يوسف",
  "يعقوب",
  "موسى",
  "هارون",
  "داود",
  "سليمان",
  "نوح",
  "لوط",
  "صالح",
  "هود",
  "إدريس",
  "زكريا",
  "يحيى",
  "عمر",
  "خالد",
  "سعد",
  "عثمان",
  "الزبير",
  "طلحة",
  "عبد الرحمن",
  "أبو بكر",
];
const AR_LAST_CLEAN = [
  "المرزوقي",
  "الغامدي",
  "الشمري",
  "القحطاني",
  "الدوسري",
  "العتيبي",
  "الفهد",
  "الناصر",
  "الحربي",
  "المطيري",
  "العتيق",
  "الغنيم",
  "الصقعبي",
  "الهاشم",
];
const TOWER_NAMES = [
  "الوفاء",
  "النور",
  "الياسمين",
  "النخيل",
  "الزهراء",
  "الواحة",
  "الرياض",
  "الحرمين",
  "العقيلة",
  "البدر",
  "القيادة",
  "الأمل",
  "السلام",
  "التاج",
  "الروان",
  "الجين",
];
const CITIES = ["مكة المكرمة", "جدة", "الرياض", "المدينة المنورة", "الدمام", "الطائف", "أبها"];
const DISTRICTS = [
  "الأزيزية",
  "الروضة",
  "الرسالة",
  "النعيم",
  "الملقا",
  "السلام",
  "الفيصلية",
  "الزهراء",
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function main() {
  const confirmed =
    process.argv.includes("--yes") ||
    process.argv.includes("--force") ||
    process.env.SEED_CONFIRM === "1";

  let existing = 0;
  try {
    existing = await prisma.building.count();
  } catch {
    console.error("The database has no application tables yet. Run `npm run db:setup` first.");
    process.exit(1);
  }

  if (existing > 0 && !confirmed) {
    console.error(`The database already holds ${existing} building(s).`);
    console.error("Run `npm run db:seed -- --force` to replace every row.");
    process.exit(1);
  }

  await prisma.revenue.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.utilityBill.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.building.deleteMany();

  const passwordHash = await bcrypt.hash("123456", 10);

  // admin user
  await prisma.profile.create({
    data: {
      id: uuid(),
      email: "admin@rentflow.sa",
      name: "مدير النظام",
      passwordHash,
      role: "ADMIN",
      buildingId: null,
    },
  });

  // CV interviewer admin account
  await prisma.profile.create({
    data: {
      id: uuid(),
      email: "omar_admin@rentflow.sa",
      name: "omar_admin",
      passwordHash: await bcrypt.hash("omar1395", 10),
      role: "ADMIN",
      buildingId: null,
    },
  });

  const buildingCount = randInt(3, 5);
  const buildings: { id: string; name: string }[] = [];
  const usedTowers = new Set<string>();

  for (let b = 0; b < buildingCount; b++) {
    let tower = pick(TOWER_NAMES);
    while (usedTowers.has(tower)) tower = pick(TOWER_NAMES);
    usedTowers.add(tower);

    const buildingId = uuid();
    const chairman = `${pick(AR_FIRST)} ${pick(AR_LAST_CLEAN)}`;
    const city = pick(CITIES);
    const district = pick(DISTRICTS);

    await prisma.building.create({
      data: {
        id: buildingId,
        name: `جمعية ملاك برج ${tower} السكني`,
        registrationNo: `${randInt(2000000000, 2999999999)}`,
        unifiedId: `705150${randInt(1000, 9999)}`,
        address: `${city} - ${district} - طريق ${pick(["الأميرات", "الملك فهد", "الحمراء", "الحرمين"])} - مبنى ${randInt(1, 50)}`,
        iban: `SA${randInt(10, 99)}${randInt(100000000000000000, 999999999999999999)}`,
        chairmanName: chairman,
        stampUrl: null,
        stampFileId: null,
      },
    });

    buildings.push({ id: buildingId, name: `جمعية ملاك برج ${tower} السكني` });

    // supervisor for this building
    const supName = `${pick(AR_FIRST)} ${pick(AR_LAST_CLEAN)}`;
    await prisma.profile.create({
      data: {
        id: uuid(),
        email: `sup-${b + 1}@rentflow.sa`,
        name: supName,
        passwordHash,
        role: "USER",
        buildingId,
      },
    });

    // units per building
    const unitCount = randInt(6, 12);
    for (let u = 0; u < unitCount; u++) {
      const unitId = uuid();
      const unitNumber = `${randInt(1, 99)}${u === 0 ? "أ" : ""}`;
      await prisma.unit.create({
        data: {
          id: unitId,
          buildingId,
          unitNumber,
          floor: `${randInt(1, 7)}`,
          titleDeedNo: `${randInt(100000, 999999)}`,
          hasParking: Math.random() > 0.5,
          annualFee: randInt(1200, 3000),
          additionalFees: randInt(0, 400),
          ownerName: `${pick(AR_FIRST)} ${pick(AR_LAST_CLEAN)}`,
        },
      });
    }
  }

  // revenues: each unit pays annual fee across 12 months (some partial/unpaid)
  const units = await prisma.unit.findMany();
  for (const unit of units) {
    const annualFee = unit.annualFee;
    const monthly = annualFee / 12;
    for (let m = 1; m <= 12; m++) {
      const roll = Math.random();
      let amount = 0;
      let channel: "CASH" | "BANK_TRANSFER" | "OTHER" = "BANK_TRANSFER";
      if (roll < 0.7) amount = monthly;
      else if (roll < 0.85) amount = monthly / 2;
      else amount = 0;
      if (amount > 0) channel = Math.random() > 0.5 ? "CASH" : "BANK_TRANSFER";
      if (amount === 0) channel = "CASH";

      await prisma.revenue.create({
        data: {
          id: uuid(),
          buildingId: unit.buildingId,
          unitId: unit.id,
          voucherNo: `#${randInt(1000, 9999)}-${m}`,
          date: new Date(2026, m - 1, randInt(1, 28)),
          fiscalYear: 2026,
          fiscalMonth: m,
          amount: Math.round(amount * 100) / 100,
          paymentChannel: channel,
          notes: m === 8 ? "رسوم الخدمة السنوية" : null,
        },
      });
    }
  }

  // expenses per building
  const categories = [
    "رواتب",
    "أدوات النظافة",
    "إصلاحات السباكة",
    "صيانة المصاعد",
    "كهرباء المناطق المشتركة",
    "مياه",
    "إزالة النفايات",
    "أمن وحراسة",
  ];
  for (const b of buildings) {
    for (let m = 1; m <= 12; m++) {
      const count = randInt(1, 3);
      for (let i = 0; i < count; i++) {
        await prisma.expense.create({
          data: {
            id: uuid(),
            buildingId: b.id,
            itemNo: i + 1,
            category: pick(categories),
            amount: Math.round(randInt(200, 5000) * 100) / 100,
            fiscalYear: 2026,
            fiscalMonth: m,
            notes: null,
          },
        });
      }
    }
  }

  // utility bills
  const billTypes = ["كهرباء عداد أ", "كهرباء عداد ب", "مياه", "اتصالات"];
  const billAccounts = ["1821913005", "5651641486", "HLY2020627038687", "SXE2020627061338"];
  for (const b of buildings) {
    for (let m = 1; m <= 12; m++) {
      const count = randInt(1, 3);
      for (let i = 0; i < count; i++) {
        await prisma.utilityBill.create({
          data: {
            id: uuid(),
            buildingId: b.id,
            type: pick(billTypes),
            accountNo: pick(billAccounts),
            meterNo: `M${randInt(100000, 999999)}`,
            amount: Math.round(randInt(300, 4000) * 100) / 100,
            paymentDate: new Date(2026, m - 1, randInt(1, 28)),
            fiscalYear: 2026,
            fiscalMonth: m,
          },
        });
      }
    }
  }

  // contracts
  const contractTitles = [
    "عقد صيانة المصاعد",
    "عقد نظافة",
    "عقد أمن وحراسة",
    "عقد صيانة كهربائية",
    "عقد صيانة مياه",
  ];
  for (const b of buildings) {
    for (let i = 0; i < randInt(1, 3); i++) {
      const total = randInt(8000, 25000);
      const paid = Math.round((total * Math.random()) * 100) / 100;
      await prisma.contract.create({
        data: {
          id: uuid(),
          buildingId: b.id,
          title: pick(contractTitles),
          totalAmount: total,
          itemCount: randInt(1, 10),
          startDate: new Date(2026, 0, 1),
          endDate: new Date(2027, 0, 1),
          nextDueDate: new Date(2026, 6, 1),
          balanceDue: Math.round((total - paid) * 100) / 100,
          vendor: `${pick(AR_FIRST)} ${pick(AR_LAST_CLEAN)} للمقاولات`,
          paidAmount: paid,
          installment: Math.round((total / 12) * 100) / 100,
          paymentNote: null,
        },
      });
    }
  }

  console.log(`Demo seed complete: ${buildingCount} buildings, ${units.length} units, random data for 2026.`);
  console.log("Admin: admin@rentflow.sa / 123456");
  console.log("Supervisors: sup-1@rentflow.sa .. sup-N@rentflow.sa / 123456");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
