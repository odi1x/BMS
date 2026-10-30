# Surface brief — اتحاد الملاك (Union of Owners)

**Scope:** the whole application shell and every screen.
**Mode:** Operate.
**Audience:** the building manager (مشرف البرج) of a residential owners' association, on a desktop, in a long session, in Arabic.
**Job:** know what has been collected against what is owed, by which units; record a receipt; close the month on a statement the chairman can sign and stamp.
**Action:** issue a receipt voucher, and chase the outstanding units.
**Proof / content:** the settlement ledger — the annual fee requirement of every unit against the vouchers actually received, per fiscal year. Real figures come from `src/lib/demo/ledger.ts` and reconcile to `product_requirements_document.md`.
**Constraints:** Arabic-first RTL with a complete English LTR locale. The NoUploadPDF brand is committed. The chrome holds no colour. No photographs exist of any association or tower, and none may be invented.

---

## Direction contract

**THESIS.** The product is not an admin dashboard with a tower table; it is a **settlement ledger** whose central question is *"how much of the annual fee is collected, and which units owe the rest?"* It refuses the category default of a four-up KPI tile row over a chart: every headline sum sits inside the card that explains it, and the screen's biggest object is the tower itself.

**OWN-WORLD.** Warm paper ground `#f7f6f3`, white surfaces, ink `#17171a` type, linen `#e4e2dc` hairlines, one privacy-green `#007d50` that means money and status and nothing else. Every figure is set in JetBrains Mono so money reads as ledger columns while the prose stays Instrument Sans. Square 4px corners on unit cells, 12px on panels, 10px on controls. Flat: no shadow on anything at rest, no gradient, no glass, no tinted tiles. The product mark is a drawn monogram, never a black square with a letter.

**STORY.** The manager opens the app and is told, without reading anything else, how much of the year's fee is in and what is still missing. They can see *which* units are missing it, floor by floor, because the tower is drawn. One click records a receipt. One click produces the month's statement.

**FIRST VIEWPORT.** A compact title row — the association name at 24px/600, a 14px line carrying the period and the finding, and the single filled ink action `سند قبض جديد` at the inline end. Below it a two-column frame: a 306px pinned **settlement tower** column (the building drawn as floors of unit cells, each cell carrying its payment state; the collection rate as its header figure) and, to its right, a two-column card grid with 24px gaps — the **collection card** spanning both columns (collected against required on the settlement track, the live unit selection, and the paid / partial / unpaid counts), then the receipts chart beside the month's expenses, then recent vouchers beside contracts due. No KPI tile row. No hero banner.

**FORM.** `achromatic-ledger`, seed `1378767146`. Three redraws, each stated: **shell** — the sheet's icon rail is redrawn to a 240px labelled sidebar on the page ground, because the product has eight destinations and needs the building switcher (app-screens §3.2 defaults to labels; the study's median labelled sidebar is 230px). **chart hue** — the sheet's `#1d5fbf` is replaced by the brand's committed privacy green `#007d50`, which the sheet permits ("the brand's own hue at 3:1 or more on white"; it is 5.0:1). **ground** — the sheet's blue-grey `#f2f4f7` is replaced by the brand's warm paper `#f7f6f3`, which is the committed identity.

**SIGNATURE INTERACTION.** The settlement tower is live. Every unit cell is a button: selecting one replaces the collection card's figures with that unit's own position — required, collected, outstanding, and its status — without a page load. The cell is also a link to that unit's settlement row in the audit, so the interaction has a plain fallback that works without script and on a phone.

**CROSS-SURFACE REACH.** The settlement track and the floor cells reappear in condensed form on the revenues audit, in the units register as a status column, and on the printable statement as the collection summary line. The privacy green means "money and status" everywhere and never decoration.

**HONEST RISK.** The settlement tower is dense and abstract; a reader who has never seen the product may not know a cell is a unit. The floor label and the paid count per floor are therefore always present beside the cells, and the legend names the three states in words.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
