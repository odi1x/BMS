import type { UnitRecord } from "@/lib/types";

export const WAFAA_ID = "bld-wafaa";
export const NOOR_ID = "bld-noor";
export const YASMIN_ID = "bld-yasmin";

export const YEAR = 2026;

/** Fiscal months present in the dataset (Gregorian). */
export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const AR_FLOORS = [
  "الأرضي",
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
  "العاشر",
  "الحادي عشر",
  "الثاني عشر",
];

export const EN_FLOORS = [
  "Ground",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
];

type UnitSeed = {
  n: string;
  f: string;
  o: string;
  p: string;
  fee: number;
  area: number;
  parking?: string;
  tenant?: [string, string];
  extra?: number;
};

const OWNERS = [
  "عبد الله محمد الغامدي",
  "نورة سالم الزهراني",
  "محمد أحمد العتيبي",
  "فهد ماجد الحربي",
  "سعاد علي الشهري",
  "خالد إبراهيم القحطاني",
  "ريم ناصر الدوسري",
  "عبد العزيز متعب الشمري",
  "منى صالح البقمي",
  "تركي فيصل المطيري",
  "أنس ماجد العمري",
  "بندر سعيد المالكي",
  "لمى عوض العنزي",
  "مشعل راشد السبيعي",
  "هيا ناصر الأهدل",
  "صالح أحمد الخالدي",
  "رنا عبد الله الفيفي",
  "غازي ناصر الرشيد",
  "مها عمر باوزير",
  "فيصل بن راشد العسيري",
  "نوال فهد القرني",
  "عائشة سامي العمودي",
  "ياسر عبد الله الحربي",
  "دلال ماجد الشهري",
  "طارق عصام الزهراني",
  "جواهر فهد المالكي",
  "سمية راشد السبيعي",
  "بندر فيصل العتيبي",
  "أسماء ناصر الشمراني",
  "ريم خالد الغامدي",
  "ماجد صالح الغامدي",
  "شهد محمد العتيبي",
  "ناصر يوسف الحارثي",
  "منال سامي القحطاني",
  "وليد عبد الله القرني",
  "عبير فهد الدوسري",
  "سلطان راشد الفيفي",
  "حصة ناصر المالكي",
  "بدر إبراهيم العسيري",
  "نوف ماجد الحربي",
  "غيث عصام الشمراني",
  "أمل ناصر العمري",
  "راكان علي الزهراني",
  "لينا سالم الحربي",
  "سعود ماجد الغامدي",
];

const TENANTS: Array<[string, string]> = [
  ["سالم ناصر الحارثي", "0551122334"],
  ["هند محمد العسيري", "0502233445"],
  ["عمر صالح الدوسري", "0533344556"],
  ["لمى خالد الغامدي", "0544455667"],
  ["طارق عصام الزهراني", "0565566778"],
  ["جواهر فهد المالكي", "0576677889"],
  ["سمية راشد السبيعي", "0587788990"],
  ["بندر فيصل العتيبي", "0598899001"],
  ["أسماء ناصر الشمراني", "0509900112"],
  ["ريم خالد الغامدي", "0510011223"],
  ["ماجد صالح الغامدي", "0521122334"],
  ["شهد محمد العتيبي", "0532233445"],
];

const WAFA_UNITS: UnitSeed[] = [
  { n: "5", f: "الأرضي", o: OWNERS[0], p: "0551234567", fee: 1500, area: 120, parking: "P-101", tenant: TENANTS[0] },
  { n: "8", f: "الأرضي", o: OWNERS[1], p: "0509876543", fee: 1500, area: 115 },
  { n: "9", f: "الأول", o: OWNERS[2], p: "0533445566", fee: 1500, area: 130, parking: "P-104" },
  { n: "12", f: "الأول", o: OWNERS[3], p: "0545556677", fee: 1800, area: 145, parking: "P-106", tenant: TENANTS[1] },
  { n: "14", f: "الأول", o: OWNERS[4], p: "0566667788", fee: 1800, area: 150 },
  { n: "15", f: "الأول", o: OWNERS[5], p: "0577778899", fee: 1500, area: 110, tenant: TENANTS[2] },
  { n: "18", f: "الثاني", o: OWNERS[6], p: "0588889900", fee: 1800, area: 135, parking: "P-203" },
  { n: "21", f: "الثاني", o: OWNERS[7], p: "0599990011", fee: 1500, area: 125 },
  { n: "24", f: "الثاني", o: OWNERS[8], p: "0501112233", fee: 2400, area: 175, parking: "P-205", tenant: TENANTS[3] },
  { n: "27 + 136", f: "الثالث", o: OWNERS[9], p: "0512223344", fee: 2400, area: 210, parking: "P-207" },
  { n: "29", f: "الثالث", o: OWNERS[10], p: "0523334455", fee: 2400, area: 160 },
  { n: "31", f: "الثالث", o: OWNERS[11], p: "0534445566", fee: 2100, area: 165, parking: "P-209", extra: 300, tenant: TENANTS[4] },
  { n: "34", f: "الرابع", o: OWNERS[12], p: "0545556677", fee: 1500, area: 120 },
  { n: "35", f: "الرابع", o: OWNERS[13], p: "0556667788", fee: 1800, area: 150, parking: "P-304" },
  { n: "39", f: "الرابع", o: OWNERS[14], p: "0567778899", fee: 1500, area: 125, tenant: TENANTS[5] },
  { n: "44", f: "الرابع", o: OWNERS[15], p: "0578889900", fee: 2100, area: 170, parking: "P-306" },
  { n: "45", f: "الخامس", o: OWNERS[16], p: "0589990011", fee: 1800, area: 140, parking: "P-307", tenant: TENANTS[6] },
  { n: "47", f: "الخامس", o: OWNERS[17], p: "0590001122", fee: 2400, area: 170 },
  { n: "51", f: "الخامس", o: OWNERS[18], p: "0501113344", fee: 2400, area: 180, parking: "P-401", extra: 1000 },
  { n: "53", f: "الخامس", o: OWNERS[19], p: "0512225566", fee: 1800, area: 150, tenant: TENANTS[7] },
  { n: "58", f: "السادس", o: OWNERS[20], p: "0523336677", fee: 1500, area: 115 },
  { n: "60", f: "السادس", o: OWNERS[21], p: "0534447788", fee: 1500, area: 120, parking: "P-503" },
  { n: "63", f: "السادس", o: OWNERS[22], p: "0545558899", fee: 1800, area: 155, parking: "P-504", tenant: TENANTS[8] },
  { n: "66", f: "السادس", o: OWNERS[23], p: "0556669900", fee: 1500, area: 120 },
  { n: "68", f: "السابع", o: OWNERS[24], p: "0567770011", fee: 1500, area: 125, parking: "P-601" },
  { n: "71", f: "السابع", o: OWNERS[25], p: "0578881122", fee: 3000, area: 220, parking: "P-602", extra: 1000, tenant: TENANTS[9] },
  { n: "74", f: "السابع", o: OWNERS[26], p: "0589992233", fee: 1800, area: 145 },
  { n: "77", f: "السابع", o: OWNERS[27], p: "0590003344", fee: 1800, area: 150, parking: "P-604" },
  { n: "81", f: "الثامن", o: OWNERS[28], p: "0501114455", fee: 1500, area: 115, tenant: TENANTS[10] },
  { n: "84", f: "الثامن", o: OWNERS[29], p: "0512225566", fee: 1500, area: 120, parking: "P-702" },
  { n: "88", f: "الثامن", o: OWNERS[30], p: "0523336677", fee: 1800, area: 140 },
  { n: "92", f: "الثامن", o: OWNERS[31], p: "0534447788", fee: 2100, area: 160, parking: "P-704" },
  { n: "95", f: "التاسع", o: OWNERS[32], p: "0545558899", fee: 1500, area: 115 },
  { n: "98", f: "التاسع", o: OWNERS[33], p: "0556669900", fee: 1800, area: 145, parking: "P-801" },
  { n: "101", f: "التاسع", o: OWNERS[34], p: "0567770011", fee: 2100, area: 165, tenant: TENANTS[11] },
  { n: "103", f: "التاسع", o: OWNERS[35], p: "0578881122", fee: 2400, area: 175, parking: "P-803" },
  { n: "106", f: "العاشر", o: OWNERS[36], p: "0589992233", fee: 1500, area: 120 },
  { n: "110", f: "العاشر", o: OWNERS[37], p: "0590003344", fee: 1800, area: 140, parking: "P-903" },
  { n: "112", f: "العاشر", o: OWNERS[38], p: "0501115566", fee: 2100, area: 160 },
  { n: "115", f: "العاشر", o: OWNERS[39], p: "0512226677", fee: 2400, area: 180, parking: "P-905" },
  { n: "118", f: "الحادي عشر", o: OWNERS[40], p: "0523337788", fee: 1500, area: 115 },
  { n: "121", f: "الحادي عشر", o: OWNERS[41], p: "0534448899", fee: 1800, area: 145, parking: "P-1002" },
  { n: "124", f: "الحادي عشر", o: OWNERS[42], p: "0545559900", fee: 2100, area: 165 },
  { n: "127", f: "الحادي عشر", o: OWNERS[43], p: "0556660011", fee: 2400, area: 175, parking: "P-1004" },
  { n: "130", f: "الثاني عشر", o: OWNERS[44], p: "0567771122", fee: 1500, area: 120 },
  { n: "133", f: "الثاني عشر", o: OWNERS[45], p: "0578882233", fee: 1800, area: 140, parking: "P-1102" },
  { n: "136", f: "الثاني عشر", o: OWNERS[46], p: "0589993344", fee: 2100, area: 160 },
  { n: "139", f: "الثاني عشر", o: OWNERS[47], p: "0590004455", fee: 2400, area: 180, parking: "P-1104" },
];

const NOOR_UNITS: UnitSeed[] = [
  { n: "3", f: "الأرضي", o: "سلطان بن ناصر الدوسري", p: "0553210098", fee: 1500, area: 118, parking: "N-01" },
  { n: "7", f: "الأرضي", o: "هند محمد العمودي", p: "0504321098", fee: 1500, area: 110 },
  { n: "12", f: "الأول", o: "ريان سعود الحربي", p: "0535432098", fee: 1800, area: 142, parking: "N-03" },
  { n: "16", f: "الأول", o: "عبير فهد المالكي", p: "0546543098", fee: 1800, area: 150 },
  { n: "19", f: "الثاني", o: "تركي ناصر العتيبي", p: "0557654098", fee: 1500, area: 122, parking: "N-05" },
  { n: "23", f: "الثاني", o: "جواهر سعود الزهراني", p: "0568765098", fee: 2100, area: 158, tenant: TENANTS[2] },
  { n: "26", f: "الثالث", o: "نايف ماجد الحربي", p: "0579876098", fee: 2100, area: 162, parking: "N-07" },
  { n: "30", f: "الثالث", o: "دلال فيصل القحطاني", p: "0580987098", fee: 2400, area: 176 },
  { n: "33", f: "الرابع", o: "عمر فهد الغامدي", p: "0591098098", fee: 1800, area: 138, parking: "N-09" },
  { n: "38", f: "الرابع", o: "سلمى ناصر الدوسري", p: "0502109098", fee: 1500, area: 115 },
  { n: "42", f: "الخامس", o: "مشعل عصام الغامدي", p: "0513210098", fee: 1800, area: 145, parking: "N-11" },
  { n: "46", f: "الخامس", o: "أمل خالد العتيبي", p: "0524321098", fee: 2100, area: 160, tenant: TENANTS[6] },
  { n: "49", f: "السادس", o: "بدر عبد الله الحارثي", p: "0535432098", fee: 1500, area: 118 },
  { n: "53", f: "السادس", o: "ريم منصور العمودي", p: "0546543098", fee: 1800, area: 140, parking: "N-13" },
  { n: "57", f: "السابع", o: "وليد ماجد الزهراني", p: "0557654098", fee: 2100, area: 155 },
  { n: "61", f: "السابع", o: "منيرة صالح المالكي", p: "0568765098", fee: 1800, area: 135, parking: "N-15" },
  { n: "64", f: "الثامن", o: "فهد ناصر الغامدي", p: "0579876098", fee: 1500, area: 112 },
  { n: "68", f: "الثامن", o: "نجود عمر الحربي", p: "0580987098", fee: 1800, area: 142, parking: "N-17" },
  { n: "72", f: "التاسع", o: "سامي راشد العتيبي", p: "0591098098", fee: 2100, area: 158 },
  { n: "76", f: "التاسع", o: "نسرين فهد الحربي", p: "0502109098", fee: 1500, area: 116 },
  { n: "79", f: "العاشر", o: "زياد ناصر الغامدي", p: "0513210098", fee: 1800, area: 136, parking: "N-19" },
  { n: "83", f: "العاشر", o: "صفاء خالد العمودي", p: "0524321098", fee: 2400, area: 172 },
  { n: "86", f: "الحادي عشر", o: "مازن ماجد المالكي", p: "0535432098", fee: 1500, area: 120, tenant: TENANTS[9] },
  { n: "91", f: "الحادي عشر", o: "رنا فيصل الزهراني", p: "0546543098", fee: 1800, area: 140, parking: "N-21" },
  { n: "95", f: "الثاني عشر", o: "عادل سالم الحربي", p: "0557654098", fee: 2100, area: 156 },
  { n: "98", f: "الثاني عشر", o: "هيفاء ناصر الدوسري", p: "0568765098", fee: 1500, area: 114 },
];

const YASMIN_UNITS: UnitSeed[] = [
  { n: "2", f: "الأرضي", o: "مروان سامي الغامدي", p: "0556010023", fee: 1500, area: 112 },
  { n: "6", f: "الأرضي", o: "لينا ناصر العتيبي", p: "0507010023", fee: 1500, area: 108, parking: "Y-01" },
  { n: "11", f: "الأول", o: "رائد ماجد الحربي", p: "0538010023", fee: 1800, area: 138 },
  { n: "15", f: "الأول", o: "عبير ناصر الدوسري", p: "0549010023", fee: 1800, area: 145, parking: "Y-03" },
  { n: "18", f: "الثاني", o: "سعد فالح الغامدي", p: "0550010023", fee: 1500, area: 115 },
  { n: "22", f: "الثاني", o: "منيرة ماجد الزهراني", p: "0561010023", fee: 1800, area: 140, tenant: TENANTS[1] },
  { n: "25", f: "الثالث", o: "عبدالله سامي الحربي", p: "0572010023", fee: 1500, area: 118, parking: "Y-05" },
  { n: "29", f: "الثالث", o: "نادية راشد العتيبي", p: "0583010023", fee: 1800, area: 136 },
  { n: "32", f: "الرابع", o: "وليد فهد المالكي", p: "0594010023", fee: 1500, area: 112, tenant: TENANTS[4] },
  { n: "36", f: "الرابع", o: "أسماء ناصر الغامدي", p: "0505010023", fee: 1800, area: 138, parking: "Y-07" },
  { n: "40", f: "الخامس", o: "ماجد عصام الحربي", p: "0516010023", fee: 1500, area: 110 },
  { n: "44", f: "الخامس", o: "شيماء فالح العتيبي", p: "0527010023", fee: 1800, area: 134, parking: "Y-09" },
];

function seedToUnit(
  seed: UnitSeed,
  index: number,
  buildingId: string,
): UnitRecord {
  const deed = String(3150040000 + index * 137);
  const electricity = `HLY20206270${38687 + index * 17}`;
  const water = `W${5651641486 + index * 7}`;
  return {
    id: `${buildingId}-u${String(index + 1).padStart(3, "0")}`,
    buildingId,
    unitNumber: seed.n,
    floor: seed.f,
    titleDeedNo: deed,
    hasParking: Boolean(seed.parking),
    parkingCardNo: seed.parking ?? null,
    electricityMeterNo: electricity,
    waterMeterNo: water,
    ownerName: seed.o,
    ownerPhone: seed.p,
    tenantName: seed.tenant?.[0] ?? null,
    tenantPhone: seed.tenant?.[1] ?? null,
    rentalDeed: seed.tenant ? `EJ-2025-${103480 + index * 7}` : null,
    unitArea: seed.area,
    annualFee: seed.fee,
    additionalFees: seed.extra ?? 0,
    photoUrl: null,
  };
}

function build(
  seeds: UnitSeed[],
  buildingId: string,
): UnitRecord[] {
  return seeds.map((seed, index) => seedToUnit(seed, index, buildingId));
}

export const demoUnits: UnitRecord[] = [
  ...build(WAFA_UNITS, WAFAA_ID),
  ...build(NOOR_UNITS, NOOR_ID),
  ...build(YASMIN_UNITS, YASMIN_ID),
];

export const WAFA_AUGUST_UNIT_NUMBERS = [
  "9",
  "34",
  "39",
  "58",
  "66",
  "5",
  "12",
  "14",
  "35",
  "45",
  "63",
  "24",
  "29",
  "31",
  "47",
  "51",
  "71",
  "27 + 136",
];
