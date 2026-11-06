# Interviewer login info — BMS / RentFlow demo

Use these accounts to explore the live demo (production).

## Admin (full access — every building)
| Field | Value |
|---|---|
| Email | `admin@rentflow.sa` |
| Password | `123456` |
| Role | System administrator |
| Access | All buildings & associations |

## Admin (your account)
| Field | Value |
|---|---|
| Email | `omar_admin@rentflow.sa` |
| Password | `omar1395` |
| Role | System administrator |
| Access | All buildings & associations |

## Supervisors (limited to one building each)
| Email | Password | Building |
|---|---|---|
| `sup-1@rentflow.sa` | `123456` | Building 1 |
| `sup-2@rentflow.sa` | `123456` | Building 2 |
| `sup-3@rentflow.sa` | `123456` | Building 3 |

## What to show
1. Log in as `admin@rentflow.sa / 123456`.
2. Dashboard (`/`) — collection rate, revenue vs expenses, outstanding fees per tower.
3. Open a tower — settlement grid (per unit per floor), monthly expenses, recent vouchers.
4. `سند قبض جديد` — create a receipt voucher; it generates a PDF with the official stamp + Arabic amount-in-words.
5. `التقرير المالي` — monthly financial statement PDF (Noto Naskh Arabic for the formal statement).
6. `بيانات الجمعية` — association profile with stamp preview.
7. `المستخدمون` — add/manage users and their building scope.

## Demo data
- 3 residential associations (برج الوفاء, برج النور, عمارة الياسمين + random towers)
- 27 units with owners, annual fees, meters
- Revenues, expenses, utility bills and contracts across 12 months of 2026
- RLS enforced — supervisors only see their own building

## Live URL
`https://mangement-system-one.vercel.app`
