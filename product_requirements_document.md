# Product Requirements Document (PRD)
## Property & Building Management System (BMS / RentFlow)

---

## 1. Executive Summary & Core Objectives

The **Building Management System (BMS / RentFlow)** is a web-based, multi-tenant administrative platform tailored for managing residential and commercial property associations (such as *جمعية ملاك برج الوفاء السكني*). 

The platform automates financial tracking, unit-level property records, utility billing ledger audits, income collection vouchers, payment status tracking, and the generation of standardized monthly financial statements.

---

## 2. System Architecture & User Roles

### Level 1: Global Administrator (`Admin`)
* **Scope:** Universal access across all registered building entities.
* **Responsibilities:**
  * Provision and configure new building entities.
  * Manage system-wide users and assign granular permissions.
  * Access aggregated multi-building financial dashboards and historical fiscal year archives.

### Level 2: Building Supervisor (`Building User`)
* **Scope:** Restricted access to assigned building(s).
* **Responsibilities:**
  * Manage apartment profiles, owner/tenant contacts, utility meters, and unit service fees.
  * Log revenue receipts (maintenance fees, rent, parking passes, water surcharges) and monitor paid vs. unpaid statuses.
  * Log utility accounts, electricity/water bills, vendor maintenance contracts, repairs, and operating expenses.
  * Export and print official monthly financial statements and payment receipts.

```
Admin Portal
 │
 ├── Global Dashboard & Building Provisioning
 │
 └── Building Module (e.g., Al Wafaa Residential Tower)
      │
      ├── Module 1: Units Management (إدارة الشقق)
      ├── Module 2: Revenues & Receipts (الإيرادات ومتابعة السداد)
      ├── Module 3: Operational Expenses & Utilities (مصاريف البرج والفوترة)
      └── Module 4: Monthly Financial Summary & PDF Reports (التقرير المالي)
```

---

## 3. Data Entry Modules & Form Specifications

### Module 1: Building Entity Configuration (`Admin / Settings`)
Captures official association metadata for printable letterheads and financial reports.

| Field Label (AR / EN) | Data Type | Required Input / Reference Standard |
| :--- | :--- | :--- |
| **اسم الجمعية / البرج** (Building Name) | Text String | e.g., جمعية ملاك برج الوفاء السكني |
| **رقم الجمعية** (Association Reg. No.) | Text String | e.g., `2423502100` |
| **الرقم الموحد** (Unified ID No.) | Text String | e.g., `7051508831` |
| **رئيس الجمعية** (Chairman Name) | Text String | e.g., جمال محمد المرزوقي |
| **العنوان الرسمي** (Official Address) | Text String | e.g., مكة المكرمة - العزيزية - طريق الطائف - بجوار المسجد القطري |
| **آيبان الحساب البنكي** (Bank IBAN) | Text String | e.g., `SA8010000067700000562109` (SNB / الأهلي) |

---

### Module 2: Units Management (الشقق)
Manages individual unit profiles, owners, tenants, and assigned meter details.

| Field Label (AR / EN) | Input Type | Entry Rules & Validation |
| :--- | :--- | :--- |
| **رقم الشقة / الدور** (Unit & Floor No.) | Text String | e.g., "شقة رقم (35)", "شقة رقم (27 + 136)" |
| **رقم الصك** (Title Deed No.) | Text String | Property title deed reference number |
| **موقف سيارة** (Parking Slot) | Checkbox + Text | `CheckBox` (Has Parking) + Slot/Card details (e.g., كرت للمواقف) |
| **عداد كهرباء** (Electricity Meter No.) | Text String | Dedicated unit electricity meter ID |
| **عداد ماء** (Water Meter No.) | Text String | Dedicated unit water meter ID |
| **اسم المالك** (Owner Name) | Text String | Full name of unit owner |
| **رقم جوال المالك** (Owner Phone) | Phone Input | Mobile contact number of owner |
| **اسم المستأجر** (Tenant Name) | Text String | Full name of current tenant (if rented) |
| **رقم جوال المستأجر** (Tenant Phone) | Phone Input | Mobile contact number of tenant |
| **صك / عقد الإيجار** (Rental Contract) | File Upload / Text | Attachment link or Ejari contract reference |
| **مساحة الشقة** (Unit Area) | Number ($m^2$) | Area in square meters |
| **رسوم خدمات البرج (سنوي)** (Annual Fee) | Currency (SAR) | Base annual tower service/maintenance fee |
| **رسوم إضافية** (Additional Fees) | Currency (SAR) | Extra surcharges (e.g., water surcharge, parking card) |

---

### Module 3: Revenues & Receipts Ledger (الإيرادات)
Logs incoming payments, issues receipt vouchers, and monitors payment statuses.

#### 1. Receipt Entry Form Fields:
* **السنة المالية** (Fiscal Year): e.g., `2026م`
* **الشهر** (Month): Month selector (e.g., `أغسطس (8)`)
* **رقم السند** (Receipt Voucher No.): Sequential voucher ID (e.g., `43`, `44`, `110`, `151`)
* **التاريخ** (Date): Format `MM/DD` (e.g., `8/1`, `8/2`, `8/16`)
* **طريقة الدفع** (Payment Channel):
  * `1` - نقداً (Cash)
  * `2` - تحويل (Bank Transfer)
  * `3` - أخرى / المواقف (Other / Parking Pass / Surcharges)
* **الشقة / المستفيد** (Target Unit / Beneficiary): Unit selector
* **المبلغ** (Amount): Amount in SAR (e.g., `1,500`, `1,800`, `3,000`, `6,000`)
* **ملاحظات** (Remarks / Description): Free text details (e.g., "شقة رقم (35)", "شقة رقم (31) مع الماء", "كرت للمواقف شقة رقم (77)")

#### 2. Automated Calculations & Audit Tracker:
* **إجمالي الإيرادات** (Total Monthly Income): Auto-calculated sum of all monthly entries (e.g., Total = `37,400.00` SAR).
* **كشف السداد** (Paid vs. Outstanding Tracker): Compares total collections per unit against annual service fee requirements to display **Paid (سدد)** vs **Unpaid/Overdue (لم يسدد)** statuses.

---

### Module 4: Operational Expenses & Utilities (مصاريف البرج والفوترة)
Tracks utility accounts, maintenance contracts, and monthly operational disbursements.

#### A. Direct Utilities & Bills Entry (فواتير الاتصالات والكهرباء والماء)

| Category / Type (النوع) | Account No. (رقم الحساب) | Amount (المبلغ SAR) | Payment Date | Notes / Bill Metadata |
| :--- | :--- | :--- | :--- | :--- |
| **الاتصالات والإنترنت** (Telecom & Internet) | `1821913005` | `299.00` | `8/31` | Internet & Router Services |
| **عداد كهرباء للبرج (أ)** (Power Meter A) | `HLY2020627038687` / `30126175787` | `2,072.81` | `8/31` | Meter A Main Power Bill |
| **عداد كهرباء للبرج (ب)** (Power Meter B) | `SXE2020627057317` / `30126175722` | `1,508.39` | `8/31` | Meter B Main Power Bill |
| **شركة المياه الوطنية** (National Water Co.) | `5651641486` | `748.04` | `8/5` | Main Water Bill |

* **إجمالي فواتير الكهرباء** (Subtotal Power): Auto-calculated $\rightarrow$ `3,581.20` SAR
* **المجموع الكلي للفواتير** (Subtotal All Utilities): Auto-calculated $\rightarrow$ `4,628.24` SAR

#### B. Monthly General Expenses Ledger (جدول المصروفات العامة)

| Item # (م) | Expense Type (النوع) | Amount (SAR) | Remarks & Contract Details (ملاحظات) |
| :---: | :--- | :---: | :--- |
| **1** | فواتير الاتصالات والنت (Telecom & Net) | `299.00` | Router & internet subscription |
| **2** | فواتير الكهرباء (Electricity Bills) | `3,581.20` | Combined Power Meters (A + B) |
| **3** | فاتورة شركة المياه (Water Bill) | `748.04` | National Water Company invoice |
| **4** | عقد النظافة والإشراف على البرج (Cleaning Contract) | `5,900.00` | Fixed monthly cleaning & supervision fee |
| **5** | عقد صيانة المصاعد (Elevator Contract) | `0.00` | **Contract Metadata:** Total (14,000 SAR), Elevators (7 units), Start (`2026/1/1`), End (`2027/1/1`), Next Due (`2026/7/1`) |
| **6** | إصلاح وقطع الغيار للمصاعد (Elevator Maintenance) | `1,800.00` | Emergency repair labor & spare parts |
| **7** | أدوات النظافة (Cleaning Supplies) | `621.31` | Cleaning consumables & soaps |
| **8** | إصلاحات السباكة وأدواتها (Plumbing Repairs) | `1,958.00` | Pipe fittings, valves, water maintenance |
| **9** | إصلاحات الكهرباء وأدواتها (Electrical Repairs) | `1,350.00` | Electrical breakers, fixtures, wiring |
| **10** | الترميم (Restoration & Upkeep) | `480.00` | Masonry, paint, minor restoration |
| **11** | الرواتب (Staff Payroll) | `7,000.00` | Monthly guard & employee wages |
| **12** | أخرى ( النثريات ) (Miscellaneous Expenses) | `231.50` | Unclassified petty cash spending |
| **TOT**| **المجموع الكلي للمصروفات** (Total Expenses) | **`23,969.05`** | **Auto-sum of items 1 through 12** |

---

### Module 5: Financial Statement & Balance Reconciliation (التقرير المالي الشهري)

#### Financial Calculation Engine:
$$\text{Total Monthly Revenue (الإيرادات)} = 37,400.00\text{ SAR}$$
$$\text{Total Monthly Expenses (المصروفات)} = 23,969.05\text{ SAR}$$
$$\text{Net Available Balance (الرصيد المتوفر)} = 37,400.00 - 23,969.05 = \mathbf{17,928.66\text{ SAR}}$$

#### PDF Engine Layout Requirements:
1. **Header Block:** Association Name (*جمعية ملاك برج الوفاء السكني*), Registration No., Unified No., Hijri Date (*التاريخ: 23/3/1448 هـ*), Gregorian Date (*الموافق: 5/9/2026 م*).
2. **Title:** *التقرير المالي لشهر أغسطس ( 8 ) للعام 2026 م*
3. **Data Grids:** Itemized Expenses Table followed by Net Financial Balance Summary Table.
4. **Signoff Footer:** Association Chairman Signature Block (*رئيس الجمعية: جمال محمد المرزوقي*), Official Stamp placeholder (*ختم الجمعية*), and official building address.

---

## 4. Database Schema (Prisma ORM)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Building {
  id               String        @id @default(uuid())
  name             String        // e.g., جمعية ملاك برج الوفاء السكني
  registrationNo   String?       // e.g., 2423502100
  unifiedId        String?       // e.g., 7051508831
  address          String?
  iban             String?       // SA8010000067700000562109
  chairmanName     String?       // e.g., جمال محمد المرزوقي
  units            Unit[]
  revenues         Revenue[]
  expenses         Expense[]
  utilityBills     UtilityBill[]
  contracts        Contract[]
  users            BuildingUser[]
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
}

model BuildingUser {
  id          String    @id @default(uuid())
  email       String    @unique
  name        String
  role        Role      @default(BUILDING_USER)
  buildingId  String?
  building    Building? @relation(fields: [buildingId], references: [id])
}

enum Role {
  ADMIN
  BUILDING_USER
}

model Unit {
  id                 String     @id @default(uuid())
  buildingId         String
  building           Building   @relation(fields: [buildingId], references: [id])
  unitNumber         String     // e.g., "35", "110", "27 + 136"
  floor              String?
  titleDeedNo        String?
  hasParking         Boolean    @default(false)
  parkingCardNo      String?
  electricityMeterNo String?
  waterMeterNo       String?
  ownerName          String?
  ownerPhone         String?
  tenantName         String?
  tenantPhone        String?
  rentalDeed         String?
  unitArea           Float?
  annualFee          Float      @default(0.0)
  additionalFees     Float      @default(0.0)
  revenues           Revenue[]
  createdAt          DateTime   @default(now())
}

enum PaymentChannel {
  CASH           // 1 - نقدا
  BANK_TRANSFER  // 2 - تحويل
  OTHER          // 3 - اخرى / مواقف
}

model Revenue {
  id             String         @id @default(uuid())
  buildingId     String
  building       Building       @relation(fields: [buildingId], references: [id])
  unitId         String?
  unit           Unit?          @relation(fields: [unitId], references: [id])
  voucherNo      String         // e.g., #43, #44, #110
  date           DateTime
  fiscalYear     Int            // e.g., 2026
  fiscalMonth    Int            // e.g., 8
  amount         Float
  paymentChannel PaymentChannel @default(BANK_TRANSFER)
  notes          String?
  createdAt      DateTime       @default(now())
}

model Expense {
  id          String   @id @default(uuid())
  buildingId  String
  building    Building @relation(fields: [buildingId], references: [id])
  itemNo      Int      // 1 to 12
  category    String   // e.g., رواتب, أدوات النظافة, إصلاحات السباكة
  amount      Float
  fiscalYear  Int      // e.g., 2026
  fiscalMonth Int      // e.g., 8
  notes       String?
  createdAt   DateTime @default(now())
}

model UtilityBill {
  id          String   @id @default(uuid())
  buildingId  String
  building    Building @relation(fields: [buildingId], references: [id])
  type        String   // Telecom, Power Meter A, Power Meter B, Water
  accountNo   String   // e.g., 1821913005, 5651641486
  meterNo     String?  // e.g., HLY2020627038687
  amount      Float
  paymentDate DateTime
  fiscalYear  Int
  fiscalMonth Int
}

model Contract {
  id           String    @id @default(uuid())
  buildingId   String
  building     Building  @relation(fields: [buildingId], references: [id])
  title        String    // e.g., عقد صيانة المصاعد
  totalAmount  Float     // e.g., 14000
  itemCount    Int?      // e.g., 7 elevators
  startDate    DateTime  // 2026-01-01
  endDate      DateTime  // 2027-01-01
  nextDueDate  DateTime? // 2026-07-01
  balanceDue   Float?
}
```