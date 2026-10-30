# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is the **building manager** (مشرف البرج) of a residential owners' association, working on a desktop through long sessions. They are finance-adjacent rather than finance professionals. They work in Arabic and read the app every working day.

Their job, in order of frequency: record and chase the **annual service fee** (رسوم خدمات البرج) against the units that owe it; issue a receipt voucher (سند قبض) when money arrives; log utility bills and operating expenses; keep the unit register accurate; and close the month by producing the **official financial statement** (التقرير المالي) with the association's stamp and the chairman's signature.

A secondary user is the **global administrator** (مدير النظام), who provisions new associations, manages users and roles, and compares financial position across every association in the system. They are rare compared to building managers.

## Product Purpose

Union of Owners (**اتحاد الملاك**) is a multi-tenant administrative platform for Saudi residential property associations. It replaces the manual working of a building manager — a paper receipt book, a spreadsheet of who paid, a shoebox of utility bills — with one ledger per association.

Success means a building manager can, in one screen, know **what has been collected against what is owed, and by which units**, and can close the month with a printable statement that reconciles to the penny.

## Positioning

The mechanism is a **settlement ledger**: the annual fee requirement of every unit is compared against the vouchers actually received, per fiscal year. The competing product for a building manager is a spreadsheet plus a WhatsApp group. The mechanism that a spreadsheet cannot reproduce is the *unit-level settlement*, with the annual fee due as the denominator and the receipt vouchers as the numerator, and an official statement generated from the same figures the ledger shows. There is no claim here beyond that mechanism, and no invented market position.

## Operating Context

- The **fiscal year and month** are the frame for every financial question. Fiscal months run January–August in the reference data.
- Money is **Saudi Riyal (SAR)**. The period under review is stated in Hijri and Gregorian dates on every official document.
- The **receipt voucher** (سند قبض) and the **monthly financial statement** (تقرير مالي) are physical artefacts of this world. They are printed, signed by the chairman, stamped with the association's official seal, and handed to the payer or the bank. They are the product's output, not a report it happens to produce.
- The **official seal** (ختم الجمعية) is an uploaded image of the association's stamp, reproduced on the statement.
- Payment arrives by **نقداً (cash)**, **تحويل (bank transfer)**, or **أخرى / المواقف (other — parking cards and surcharges)**.
- Associations are legal entities with a **registration number** (رقم الجمعية) and a **unified ID** (الرقم الموحد); both appear on the statement.
- The association holds a **bank IBAN** (آيبان) for its operating account.
- Each unit may hold a **parking slot/card** (كرت للمواقف) whose sale is a separate receipt line from the annual fee.
- Utility accounts belong to the **building**, not the unit: telecom/internet, power meter A, power meter B, and the national water company.

## Capabilities and Constraints

- **Role-scoped access.** A building manager sees only their assigned association(s); the global administrator sees every association. Every read and write is scoped to one association.
- **Modules.** Units register; revenues and receipt vouchers with paid/unpaid settlement tracking; utility bills, a twelve-item operating expense ledger, and vendor contracts; the monthly financial statement.
- **Twelve canonical expense items** are fixed by the specification: telecom and internet, electricity, water, cleaning and supervision contract, elevator maintenance contract, elevator repair and spares, cleaning supplies, plumbing repairs and supplies, electrical repairs and supplies, restoration and upkeep, staff payroll, and miscellaneous.
- **Documents.** Statement and voucher are rendered as HTML and converted to PDF through a local Chrome/Chromium. The statement is emailed with a **signed, expiring public link** so a payer without an account can open it; the link is scoped to one association and one period.
- **Images.** Unit photographs, user avatars, and the association seal upload directly to ImageKit from the browser.
- **Runs without a database.** With `DATABASE_URL` unset the app serves a read-only seeded ledger from the reference figures in the specification; every write is refused with a clear message. The seed reconciles to the specified totals.
- **Bilingual.** Arabic is the primary language and the layout is right-to-left; English is a complete second locale with left-to-right layout. Currency, units and dates are locale-aware.
- **Sample data.** The seeded dataset is derived from the specification's reference figures for one association (Al Wafaa). It is computed from rows and reconciles to the specified totals. It is sample data and must be replaced with the client's own associations before launch. There are no customer logos, testimonials, press, reviews, or usage statistics anywhere in this product, and none may be invented.

## Brand Commitments

- The product is called **اتحاد الملاك** (Union of Owners).
- The **NoUploadPDF** palette is committed: ink `#17171a` on a warm stone ground, with a single green accent `#007d50` reserved for money, status and the product's one data element. The chrome holds no colour.
- Arabic-first. The RTL layout is the default, not a translation of an LTR design.

## Evidence on Hand

- `product_requirements_document.md` — the authoritative specification: roles, module field lists, the twelve expense items, and the reference August 2026 figures (revenue `37,400.00`, expenses `23,969.05`, power subtotal `3,581.20`, utilities total `4,628.24`).
- `nouuploadpdf-DESIGN.md` — the committed design system source.
- `src/lib/demo/ledger.ts`, `src/lib/demo/units.ts` — the seeded reference dataset: three associations, 82 units, vouchers, bills, expenses and contracts, reconciled to the specification.
- **Absences.** No photography of any association, tower, or seal. No client logos. No testimonials. No performance or adoption statistics. The product therefore shows no photographs of buildings; unit photographs and the association seal are uploaded by the client at runtime and are absent until then.

## Product Principles

1. **One association at a time.** The building manager's job is scoped to their tower; the association is the unit of work, not the system.
2. **The settlement ledger is the spine.** Every collection figure is derived from the same unit-to-voucher comparison, and the statement is generated from those figures rather than re-keyed.
3. **Money is exact and unambiguous.** Two decimals, thousands separators, tabular figures, the currency on every figure, and totals that reconcile to the rows shown.
4. **The artefact is the product.** A voucher and a statement are documents a chairman signs and stamps, not screens.
5. **Say what is missing.** A zero prints as a zero; an absent value prints as a dash. Nothing is estimated, rounded away, or filled in.

## Accessibility & Inclusion

- Arabic and English are both first-class. The RTL layout is structural, not a mirrored afterthought.
- Minimum 4.5:1 contrast for body text on every surface; 3:1 for large text and interface boundaries.
- Every control is reachable and operable from the keyboard, in reading order, with a visible focus ring and an accessible name.
- Touch targets at least 44px tall on the phone; data and labels no smaller than 13px, meta text no smaller than 12px.
- `prefers-reduced-motion` removes movement while keeping every state legible.
