# BMS · RentFlow

منصة إدارة البرج والجمعيات العقارية — نظام متعدد المستأجرين لإدارة الشقق،
سندات القبض، متابعة السداد، المصروفات والفوترة، وإصدار التقارير المالية الرسمية.

Arabic-first (RTL) with full English (LTR) support.

---

## Stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + design tokens from `nouploadpdf-DESIGN.md` |
| Icons / motion | Lucide React · Framer Motion |
| Database | PostgreSQL + Prisma 6 (multi-tenant schema) |
| Media | ImageKit.io (direct browser upload + signed auth endpoint) |
| Documents | HTML → PDF via `puppeteer-core` (official vouchers & statements) |
| Email | Resend REST API (responsive HTML statements & receipts) |
| Validation | Zod 4 |

---

## Quick start

```bash
npm install
cp .env.example .env             # ثم املأ ما تحتاجه
npm run dev
```

Open `http://localhost:3000`.

> `.env` (not `.env.local`) — the Prisma CLI and the `db:*` scripts read `.env`.

### Demo mode (no database required)

Leave `DATABASE_URL` unset and the app boots with a **read-only demo ledger**
seeded from the PRD's reference figures (3 associations, 82 units, and the
August 2026 statement: revenue `37,400.00`, expenses `23,969.05`, net `13,430.95`).
A banner appears on every screen explaining that writes are disabled.

Demo accounts use the password `123456`:

| Email | Role |
| :--- | :--- |
| `admin@rentflow.sa` | System admin — all towers |
| `supervisor@rentflow.sa` | Tower manager — Al Wafaa |
| `noor@rentflow.sa` | Tower manager — Al Noor |

### Database mode (Supabase + full CRUD)

```bash
# 1. Supabase → Connect → Direct connection → Connection string (URI)
#    DATABASE_URL = Transaction pooler (6543)  → runtime
#    DIRECT_URL   = Direct connection (5432)   → migrations
npm run db:doctor      # يتحقق من صيغة الرابطين قبل لمس قاعدة البيانات
npm run db:setup       # يطبّق الترحيلات ويمنح دور app_user
npm run db:seed        # بيانات تجريبية مطابقة لسجل أغسطس 2026
npm run db:check-rls   # يثبت أن العزل على مستوى الصفوف يعمل
npm run dev
```

`npm run db:setup` detects an empty database, an old schema that still has the
`BuildingUser` table, or a database that is already on the current shape, and
migrates accordingly without losing rows.

`npm run db:seed` verifies the financial totals against the PRD before writing,
so a broken seed fails loudly instead of silently corrupting the ledger. It
replaces every row, so it refuses to run on a database that already holds data
unless you pass `--force`.

---

## Modules

| Route | Purpose |
| :--- | :--- |
| `/` | Global admin dashboard — aggregated position across every association |
| `/buildings/new` | Provision a new tower / association |
| `/buildings/[id]` | Tower summary — annual fee collection, floor stack, contracts |
| `/buildings/[id]/units` | Units — table **and** card grid, full PRD field set, photo upload |
| `/buildings/[id]/revenues` | Receipt vouchers, fiscal period filter, paid/unpaid audit grid |
| `/buildings/[id]/expenses` | Utility bills, 12-item expense ledger, contract tracking |
| `/buildings/[id]/financial-summary` | Official monthly statement — print + PDF + email |
| `/buildings/[id]/settings` | Association metadata, IBAN, official stamp |
| `/buildings/[id]/vouchers/[voucherId]` | Printable receipt voucher (سند قبض) |
| `/users` | User provisioning, roles, avatars |

### Fiscal period

Every financial screen reads `?year=&month=` and offers a period picker.
The annual settlement audit is year-scoped; monthly totals are month-scoped.

---

## Environment variables

See `.env.example` for the full list. Summary:

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | for writes | Runtime connection — Supabase transaction pooler (6543) with `pgbouncer=true` |
| `DIRECT_URL` | for migrations | Direct (5432) or session-pooler connection used by the Prisma CLI |
| `DATABASE_RUNTIME_ROLE` | optional | Role Prisma assumes inside the transaction (`app_user`, default) |
| `SESSION_SECRET` | production | Signs the session cookie and public download links |
| `IMAGEKIT_PUBLIC_KEY` | for uploads | ImageKit public key (also used in the browser) |
| `IMAGEKIT_PRIVATE_KEY` | for uploads | ImageKit private key (server only) |
| `IMAGEKIT_URL_ENDPOINT` | for uploads | e.g. `ik.imagekit.io/your-app-id` |
| `RESEND_API_KEY` | for email | Resend API key |
| `EMAIL_FROM` | for email | Verified sender address |
| `CHROME_PATH` | optional | Chrome/Chromium binary for PDF generation |

---

## Row Level Security

Isolation is enforced by Postgres, not only by the application code:

- Every table in `public` has RLS enabled, one policy per operation, and no
  grants for `anon` / `authenticated` (`prisma/migrations/0003_row_level_security`).
- `profiles.id` is the identity carried in the session JWT (`sub` claim);
  `profiles.buildingId` is the tenant key every other table hangs off.
- `src/lib/db/tenant.ts` runs every query in a transaction that carries the
  caller's claims (`request.jwt.claims`) and switches to the non-owning role
  `app_user`, so the policies apply instead of being skipped by the table owner.
- A user sees only its own association; an admin sees every association. A user
  cannot promote itself to `ADMIN` or move itself to another association.
- New tables created later are locked down automatically by an event trigger.

`npm run db:check-rls` asserts those rules against the live database.

---

## Deploy to Vercel

1. Push this repository to GitHub, then **Import Project** in Vercel.
2. Add the environment variables from `.env.example` in
   *Project → Settings → Environment Variables* (at least `DATABASE_URL`,
   `DIRECT_URL`, `SESSION_SECRET`).
3. Keep `DATABASE_URL` on the transaction pooler with `pgbouncer=true` and a
   small `connection_limit` — serverless instances open many short-lived
   connections.
4. The build runs `prisma generate && next build`; `prisma generate` needs no
   database connection.
5. PDF generation needs Chromium on the server. Either install it in the build
   image or point `CHROME_PATH` at a bundled binary — without it the PDF routes
   return `500 { error: "PDF_FAILED" }`.

---

## PDF generation

Vouchers and statements are rendered as HTML and converted with `puppeteer-core`.
A local Chrome or Chromium install is required — the binary is discovered
automatically on Windows, macOS and Linux, or can be pinned with `CHROME_PATH`.

For a container image, install Chromium at build time:

```dockerfile
RUN apt-get update && apt-get install -y chromium fonts-noto-core fonts-noto-cjk
ENV CHROME_PATH=/usr/bin/chromium
```

If Chrome is missing, the PDF routes return `500 { error: "PDF_FAILED" }` and log
the underlying cause to the server output.

---

## Architecture notes

- **Multi-tenancy** — every record hangs off `Building`; `requireBuildingAccess()`
  in `src/lib/auth.ts` is the authorisation choke point for reads and writes,
  and Postgres RLS is the second, database-level line of defence.
- **Dual data store** — `src/lib/store.ts` returns either the Prisma store or
  the static demo store depending on `DATABASE_URL`. This keeps the app
  runnable without infrastructure while keeping a single query surface.
  `store()` runs privileged, `tenantStore(context)` runs inside the RLS
  transaction — session-bound pages and actions use the second one, signed
  public links use the first.
- **Server Actions** — all mutations live in `src/app/actions/records.ts` and
  `src/app/actions/images.ts`, are Zod-validated, and revalidate the affected
  routes.
- **Design system** — tokens live in `src/app/globals.css` and map the colour,
  radius, spacing and typography scales defined in `nouploadpdf-DESIGN.md`.
  Layout is flat: hairline borders instead of shadows, one accent green
  reserved for money and success.

---

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:push` / `db:migrate` | Apply schema changes during development |
| `npm run db:deploy` | Apply pending migrations (CI / production) |
| `npm run db:setup` | Inspect the database, migrate, and wire the runtime role |
| `npm run db:doctor` | Validate the two connection strings before connecting |
| `npm run db:grant` | Grant `app_user` to the role Prisma connects as |
| `npm run db:check-rls` | Assert the Row Level Security rules against the live database |
| `npm run db:seed` | Seed the reference dataset (`--force` to replace existing rows) |
| `npm run db:studio` | Prisma Studio |

---

## Specification

The implementation follows `product_requirements_document.md` (PRD) and
`nouploadpdf-DESIGN.md` (design system) in this repository.
