# Design system — اتحاد الملاك (Union of Owners)

Status: shipping baseline. Grounded in the committed NoUploadPDF design system (`nouuploadpdf-DESIGN.md`) and the surface brief (`.impeccable/surfaces/app.md`). The committed palette is not up for debate; the page ground `#f7f6f3` is the brand's warm paper and is deliberately kept even where generic tooling flags it as "cream".

## Product

**Product:** اتحاد الملاك — Union of Owners, a multi-tenant administrative platform for Saudi residential owners' associations.
**Audience:** the building manager (مشرف البرج), desktop, long daily sessions, Arabic-first with a complete English LTR locale. Secondary: the global administrator (مدير النظام).
**Job:** know what has been collected against what is owed, by which units; record a receipt; close the month on a statement the chairman can sign and stamp.
**Mechanism:** settlement ledger — the annual fee requirement of every unit compared against the vouchers actually received, per fiscal year. Money is Saudi Riyal; figures carry two decimals, thousands separators, tabular monospace figures, and currency on every figure; totals reconcile to the rows shown.

## Direction contract

**Thesis:** not an admin dashboard with a tower table. The screen's biggest object is the tower itself; every headline sum sits inside the card that explains it. There is **no four-up KPI tile row** and **no hero banner**.

**Own-world:** warm paper ground `#f7f6f3`, white surfaces, ink `#17171a` type, linen `#e4e2dc` hairlines, one privacy-green `#007d50` that means money, status and the settlement track — and nothing else. Figures are JetBrains Mono so money reads as ledger columns; prose is Instrument Sans; Arabic is Noto Sans Arabic.

**Flat:** no shadow on anything at rest, no gradient, no glass, no tinted tiles. Hairlines do the job shadows would do elsewhere.

**First viewport:** compact title row — association name at 24px/600, a 14px line carrying period + finding, and the single filled ink action `سند قبض جديد` at the inline end. Below it a two-column frame: a 306px pinned settlement tower column (floors of unit cells, each cell carrying its payment state; collection rate as header figure) and, to its right, a two-column card grid with 24px gaps — collection card spanning both columns, then receipts chart beside month's expenses, then recent vouchers beside contracts due.

**Honest risk:** the tower is dense and abstract; the floor label and paid count per floor are always present beside the cells, and the legend names the three states in words.

## Tokens

Colors (committed, NoUploadPDF palette):

| Token | Value | Use |
|---|---|---|
| ink / primary | `#17171a` | headlines, body, primary buttons, logo tile |
| privacy green / tertiary | `#007d50` | money, status, settlement track, success |
| green active | `#019f68` | active green states |
| green text | `#00673f` | green labels on white |
| green tint | `#e1f8eb` | green container |
| green light | `#56d298` | green on ink backgrounds |
| paper / neutral | `#f7f6f3` | page ground (brand neutral — kept) |
| surface | `#ffffff` | cards, panels, inputs |
| sunk | `#fbfaf8` | drop zones, previews |
| chip | `#f1efea` | secondary fills |
| outline | `#e4e2dc` | 1px hairlines |
| outline-strong | `#d6d3cb` | stronger boundaries |
| divider | `#eeece7` | row dividers |
| muted | `#6b6a64` | descriptions, meta |
| subtle | `#8a8880` | placeholders, faint meta |
| negative | `#b42318` | negative balances (text-negative-ink) |

Typography:

| Role | Family | Size | Weight | Leading | Tracking |
|---|---|---|---|---|---|
| title (PageHeader) | Instrument Sans | 24px | 600 | 1.2 | -0.02em |
| heading h2/h3 | Instrument Sans | 17–20px | 600 | 1.1–1.2 | -0.01em–-0.02em |
| body | Instrument Sans | 14px | 400 | 1.55 | — |
| label | Instrument Sans | 14–15px | 500 | 1.0–1.5 | — |
| money / figures | JetBrains Mono | 12–14px | 400–500 | 1.3–1.4 | — |
| meta / faint | Instrument Sans | 11–12px | 400 | 1.0 | — |
| Arabic prose | Noto Sans Arabic | matched to context | 400–600 | 1.55 | — |

Radii: 4px unit cells / badges, 6px icon buttons, 10px buttons/inputs/file rows, 12px panels/cards, 16px large panels, 9999px pills.

Spacing rhythm: 4/8/12/16/24/32/48/56; sections 88–96px; card grid gap 24px.

Breakpoint 760px; design and test at 390 × 844 (mobile) and 1440 × 900 (desktop).

## Components

**Panel:** white surface, 12px radius, 24px padding, 1px outline hairline, title 18px/600 instrument sans, optional 14px muted hint line. No shadow at rest.

**MetricStrip:** metric figures in JetBrains Mono 22–24px with currency unit; label 12px muted; optional hint line 12px; `answer: true` for the headline figure; `tone: "negative"` renders the value in `#b42318`.

**PageHeader:** 64px sticky header holds no colour (paper ground). Title row: 24px/600 association name, 14px finding line, filled ink primary action at inline end, PDF + print actions secondary.

**Settlement tower:** 306px pinned column; building drawn as floors of unit cells; each cell 4px radius, a button carrying paid/partial/unpaid state (green dot / grey empty / outline), collection rate as header figure, floor label and paid count per floor always present, legend names the three states in words.

**Data table:** 14px body, 12px headers, no zebra striping, 1px divider rows, tabular monospace figures right-aligned, truncate long text with `max-w-[320px]`, horizontally scrollable on small screens.

**Buttons:** primary ink fill `#17171a` on paper text `#f7f6f3`; secondary white surface with outline-strong border; green reserved for money/status/success only. Touch targets ≥44px on phone.

**Privacy pill:** green container `#e1f8eb`, `#00673f` mono text, 6px accent dot.

**Print statement:** `border border-line bg-surface p-8`, chairman name, stamp (uploaded association seal, absent until uploaded), IBAN, registration number, unified ID, Hijri + Gregorian dates, footer with chairman signature line.

**Chrome:** holds no colour. Eight destinations via labelled sidebar. No photographs of associations, towers, or seals; unit photos and the association seal upload to ImageKit at runtime and are absent until then. Product mark is a drawn monogram, never a black square with a letter.

## Accessibility

- Arabic RTL structural default, English LTR second locale.
- Minimum 4.5:1 body contrast; 3:1 large text and boundaries.
- Keyboard operable in reading order with visible focus rings and accessible names.
- `prefers-reduced-motion` removes movement while keeping every state legible.

## Screens (10)

1. Tower (association scope) — settlement ledger first view.
2. Revenues — receipt vouchers audit with paid/unpaid settlement tracking.
3. Expenses — utility bills + twelve-item operating expense ledger + monthly trend.
4. Financial summary — monthly chart + printable financial statement.
5. Units — unit register with settlement status column.
6. Settings — association official data + seal upload.
7. Users — role-scoped users and capabilities.
8. New building — association onboarding form.
9. Login — demo credentials + ledger preview.
10. Vouchers detail — individual receipt voucher.

## Compliance

Every screen passes the design meter at 0 FAIL with only the defended `palette-cream` WARN (brand ground `#f7f6f3`). Final gate: `npx next build` clean + 10-route smoke test through the inspector proxy.
