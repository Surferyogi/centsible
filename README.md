# Centsible

A standalone PWA for monitoring the monthly 給与明細書 and 賞与明細書 issued by 株式会社ペイロール on
behalf of 株式会社エア・リキード・ラボラトリーズ, and reconciling them against the annual 源泉徴収票.

Everything runs on device: documents are read, stored and checked in the browser and are never
transmitted anywhere. Built to the same pattern as Fortress — standalone GitHub Pages deployment,
on-device pdf.js parsing, localStorage history with JSON bkp

Current build: **v2026:AUG:25-13:53**

---

## Deploying to GitHub Pages

The repository is named **`centsible`** (lowercase), so the site is served at
`https://<your-user>.github.io/centsible/`. That path is baked into `vite.config.js` as
`base: '/centsible/'` and **must match the repository name exactly, including case** — if it does
not, every asset 404s and the page loads blank.

### 1. Push the files

```bash
git init
git add .
git commit -m "Centsible v2026:AUG:25-07:15"
git branch -M main
git remote add origin https://github.com/<your-user>/centsible.git
git push -u origin main
```

### 2. Turn on Pages

In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

That is the only setting to change. The included workflow at `.github/workflows/deploy.yml` builds
and publishes on every push to `main`; watch it under the **Actions** tab. First deploy takes a
couple of minutes.

### 3. Install it as an app

Open the site, then **Add to Home Screen** (iOS Safari) or the install icon in the address bar
(desktop Chrome/Edge). It then runs offline.

### If you name the repository something else

Change one line in `vite.config.js`:

```js
base: '/your-repo-name/',
```

### Alternative: manual branch deploy

`npm run deploy` builds and pushes `dist/` to a `gh-pages` branch instead. If you use this, set
Pages **Source** to *Deploy from a branch → gh-pages*, and do not use the Actions workflow as well —
pick one.

---

## Running it locally

```bash
npm install
npm run dev      # local development server
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

---

## What it does

| Tab | Purpose |
|---|---|
| **Dashboard** | Allocation of the latest gross pay, headline ratios, and what moved since last month |
| **Trends** | Selectable series plotted across every stored payslip |
| **Checks** | Arithmetic integrity rules run against any chosen payslip |
| **Year-end** | Stored payslips reconciled against the annual 源泉徴収票 |
| **Add document** | PDF drop, paste text, or manual entry, for either document type |
| **History** | Every stored document, with a full line-by-line view |
| **Settings** | Movement threshold, JSON/CSV backup, restore, reset |

Data lives only in your browser, so **take a JSON backup from Settings before clearing site data or
changing device**.

---

## Two document types

The employer issues two documents through 株式会社ペイロール:

| Type | Japanese | Notes |
|---|---|---|
| `salary` | 給与明細書 | The monthly payslip |
| `bonus` | 賞与明細書 | One-off payments — vacation allowance, childcare allowance |
| `withholding` | 源泉徴収票 | Annual employer statement. Not a payment: excluded from every aggregate, used as a control total |
| `taxreturn` | 確定申告書 | The filed personal return. The only document capturing salary paid outside Japanese payroll |

They share a layout but not their labels: a bonus prints `Adjustment` **or** `Bonus` for the payment
itself (2025-01 and 2025-06 use the former, 2026-01 the latter — both are carried), plus `Deduction Total`,
`Total Taxable Amount` and `Total Non-Taxable Amount` where a monthly slip prints
`Executive compensation`, `Total Deduction`, `TTL Taxable` and `TTL N-Taxable`. A bonus carries no
benefit in kind, no health insurance, no nursing insurance, no inhabitant tax and no split payment,
and it may carry a free-text note at the foot of the page.

**A single month can produce one of each — January 2025 and January 2026 both do.** Records are therefore keyed on
`period + docType`. Keying on period alone would let a bonus silently overwrite that month's
payslip.

## Integrity rules

Each rule was tested against the thirty-nine documents transcribed from the uploaded images before
being encoded. The `verified` note on each rule records how many documents it held for.

| Rule | Severity | Held for |
|---|---|---|
| Income lines sum to Total Gross Pay | error | 38 of 38 payment docs |
| Gross-up = Income Tax + Social Insurance TTL | error | 38 of 38 payment docs |
| Health + Nursing + Welfare = Social Insurance TTL | error | 37 of 37 carrying the lines |
| Deduction lines sum to the deduction total | error | 38 of 38 payment docs |
| Net Pay = Gross − Deduction + disbursements | error | 38 of 38 payment docs |
| Taxable Pay = TTL Taxable − Social Insurance | error | 34 of 34 monthly |
| Tax Returns nets to zero against Tax Retun_D | error | 3 of 3 Tax Returns months |
| Provisional Tax nets to zero on a bonus | error | 1 of 1 carrying the line |
| Bank net pay lines reconcile to Total Net Pay | warn | 37 of 38 payment docs |
| Welfare pension charged at 9.15% | warn | 37 of 37 |
| Other Deduction vs inhabitant tax | info | 23 of 23 ordinary months; excluded on Tax Returns months |
| Health insurance rate on the standard grade | info | 34 of 34 monthly |
| Taxable amount (Deduction) = Benefit In Kind + housing excess | info | 32 of 34 monthly |
| Bonus welfare pension respects the ¥1,500,000 cap | info | 4 of 4 bonuses |
| Bonus carries no health or nursing insurance | info | 4 of 4 bonuses |

The annual 源泉徴収票 is exempt from these rules by design — it declares one total per measure and
has no internal arithmetic. It is verified instead by the Year-end reconciliation.

### Two findings worth recording

**Net pay is not Gross − Deduction.** On the 2024-07 payslip, Gross (¥4,850,518) minus Total
Deduction (¥4,074,222) is ¥776,296, but Total Net Pay shows ¥805,391. The ¥29,095 difference is
exactly the AL Share Dividends line in the DETAILS column. The DETAILS "Disburs." lines are
add-backs to net pay, not information-only. The rule implemented is:

```
Net = Gross − Total Deduction + Life Insur. Disburs. + Zenrosai Disburs. + AL Share Dividends
```

**Two lines are printed but not withheld.** `Child and Child-rearing Support` (¥1,598) and
`定額減税 (Tax reduction)` both sit outside the deduction total. The tax-reduction case was only
provable once a payslip carried a non-zero value: on 2024-06 it is ¥30,000, and Total Deduction
reconciles only when it is excluded. Every earlier payslip showed it as zero, which hid the
distinction.

**Tax Returns months behave differently.** Three payslips carry a year-end true-up as a matched
pair — `Tax Returns` in income and `Tax Retun_D` in deduction, netting to zero: −¥1,074,247 on
2024-06, +¥6,001,600 on 2025-07 and +¥8,530,519 on 2026-06 (which pushed gross to ¥21.2M). Bonus
statements carry an equivalent `Provisional Tax` pair. The pair changes gross pay, and therefore the income
tax computed on it, without changing the cash received. (`Tax Retun_D` is spelled that way on the
document.)

**Inhabitant tax is largely offset by the Other Deduction credit.** `Other Deduction` is negative
and moves in lockstep with `Inhabitant Tax`, leaving a residual that is constant inside each
June-to-May collection cycle:

| Period | Inhabitant tax | Other Deduction | Residual |
|---|---|---|---|
| Jul 2024 – Apr 2025 | ¥135,400–135,500 | −¥117,923 to −¥118,023 | **¥17,477** |
| May 2025 | ¥135,400 | −¥52,213 | **¥83,187** |
| Jun 2025 – Apr 2026 | ¥517,200–517,300 | −¥434,017 to −¥434,117 | **¥83,183** |
| May 2026 | ¥517,200 | −¥284,085 | **¥233,115** |
| Jul – Aug 2026 | ¥805,500 | −¥572,394 | **¥233,106** |

The residual steps up in May, one month before the inhabitant tax amount itself changes in June.

**But the relationship is not universal, and Other Deduction is not simply an inhabitant tax
offset.** Two payslips break it, and both are Tax Returns months:

- **2024-06** carries a **positive** Other Deduction of ¥221,418 and **no inhabitant tax line at
  all**.
- **2025-07** leaves a residual of ¥287,123 rather than the ¥83,183 its neighbours show.

The rule therefore skips Tax Returns months rather than flagging them, and the app reports
inhabitant tax net of the offset only where the offset is present. What `Other Deduction` actually
represents remains unknown — the line is unlabelled, and this is an observed correlation in ordinary
months, not a stated fact.

### Resolved by the compensation tracking sheet

CK's own compensation spreadsheet names two lines the payslip leaves unlabelled, and its figures
match the payslip arithmetic to the yen:

| Payslip arithmetic | Sheet column | Value |
|---|---|---|
| `Taxable amount (Deduction)` − `Benefit In Kind` | **Deduction (over housing allowance)** | ¥218,029, unchanged 2024–2026 |
| `Inhabitant Tax` + `Other Deduction` | **Deduction (individual income tax)** | ¥17,477 → ¥83,183 → ¥233,106 |
| `AL Stock Purchase` | **Deduction (AL shares)** | ¥111,600 (2024) → ¥201,000 (2026) |

So the ¥218,029 is the housing cost above the company allowance, and the residual is the individual
income tax actually borne. In the three Tax Returns months the payslip residual exceeds the tracked
figure by exactly ¥203,940, which equals the `Other Allow./Pay` line on those same payslips —
observed, not explained.

### Still not verified

1. **Why no bonus statement charges health or nursing insurance.** Japanese bonuses normally
   attract health and nursing premiums as well as welfare pension. All four bonus statements charge
   welfare pension only. Worth asking payroll.
2. **Why the health insurance premium moved twice in 2026.** On the fixed ¥1,390,000 standard
   remuneration grade the premium was ¥67,415 (4.850%) through March 2026, ¥66,025 (4.750%) in
   April, then ¥67,623 (4.865%) from May. The April-to-May increase of ¥1,598 is exactly the
   `Child and Child-rearing Support` figure that starts appearing as its own line in May, which
   suggests April folded it into the health premium. Observed, not stated.

---

## Absent vs zero

A payslip line that is not present on the document is stored as `null` and rendered as
*not on this payslip*. A line that is present and shows zero is stored as `0`. The distinction is
load-bearing: the 2023-09 payslip carries no social insurance lines at all, which is different from
carrying them at zero. Manual entry preserves this — an empty box means absent.

---

## Reading PDFs

`src/lib/parse.js` extracts text with pdf.js, rebuilds visual rows by grouping text items on their
y-coordinate (without this the three payslip columns interleave), then matches each known English
label and takes the first number that follows it.

Label matching is **case-sensitive by design**. The template uses `Health Insurance` for the
premium withheld (~¥67k, DEDUCTION column) and `Health insurance` for the standard remuneration
grade (¥1,390,000, DETAILS column). Case-insensitive matching would conflate the two.

Numbers are parsed after full-width normalisation and accept `1,234`, `-1,234`, `△1,234` and
`(1,234)`.

Document type is detected from the 給与明細書 / 賞与明細書 header, and only the fields that exist on
that document type are searched for. The free-text note at the foot of a bonus statement is
letter-spaced in the template (`c h i l d c a r e   a l l o w a n c e`) and is collapsed back into
words on import.

**This has been tested against reconstructed text, not against the real PDFs** — the source
documents supplied were screenshots, so whether the originals carry a text layer is unconfirmed.
If a PDF returns no text it is a scan; the app says so and directs you to manual entry.

---

## Storage and privacy

Payslips are kept in `localStorage` under `centsible.payslips.v1`. Nothing is uploaded, and there is
no backend. Anything saved under the app's former name (Meisai) is migrated across automatically on
first load. The trade-off is that clearing site data or changing device loses the history, so use
the JSON backup in Settings.

Forty-two documents are installed on first run, transcribed from the supplied images:
twenty-five monthly payslips between Sep 2023 and Aug 2026, plus four bonus statements, two 源泉徴収票 and two filed 確定申告書.
They can be cleared from Settings and are not reinstalled afterwards.

Personal identifiers on the returns and statements — マイナンバー, residence card number, home
address, and family members' names and dates of birth — are deliberately **not** stored. They serve
no monitoring purpose.

### Coverage gaps

Stored months, by year: 2023 — Sep, Dec. 2024 — **complete**. 2025 — **complete**. 2026 — Jan–Aug
(complete to date). Bonus statements: Jan 2025, Jun 2025, Jan 2026, Jul 2026. Annual statement:
令和6年分 (2024).

**Known missing bonus statements**, identified from the compensation tracking sheet but not yet
supplied as documents: Jul 2025 (vacation allowance 2nd instalment, net ¥418,905), May 2026
(childcare allowance, net ¥688,800), and an Apr 2026 performance bonus paid in Singapore
(SGD 79,248). Plus whatever 2024 bonuses account for the reconciliation gap below.

Annual totals are labelled incomplete wherever fewer than twelve monthly payslips are present, so
they are never mistaken for full-year figures.

## Year-end reconciliation — three layers

The Year-end tab reconciles outward through three layers, each the authority for the one inside it:

1. **Payslips** — what this app has stored
2. **源泉徴収票** — what the employer declared for salary run through Japanese payroll
3. **確定申告書** — the filed return, which alone captures salary paid *outside* Japanese payroll

### The layer the payslips cannot see

Both filed returns declare **国外払い給与** — salary paid outside Japan, carrying no Japanese
withholding and appearing on no payslip and on no 源泉徴収票:

| Year | Paid in Japan (源泉徴収票) | 国外払い給与 | Total declared | Overseas share |
|---|---|---|---|---|
| 2024 | ¥63,973,440 | ¥1,576,715 | ¥65,550,155 | 2.41% |
| 2025 | ¥95,832,023 | ¥4,768,698 | ¥100,600,721 | 4.74% |

Because nothing is withheld against it, the tax on this portion falls due when the return is filed
rather than month by month.

### Settlement on filing

| | 2024 | 2025 |
|---|---|---|
| Total tax liability | ¥23,510,618 | ¥39,396,561 |
| Less tax withheld | −¥22,604,714 | −¥37,082,575 |
| Less foreign tax credit | −¥112,579 | −¥125,469 |
| Less 予定納税 prepaid | — | −¥527,000 |
| **Balance paid on filing** | **¥793,300** | **¥1,661,500** |

Both returns verify internally to the yen, including the 2.1% reconstruction surtax, the 15%
separate rate on dividends, and the 10% French withholding on Air Liquide dividends.

### Gap between payslips and 源泉徴収票

| Measure | 2024 | 2025 |
|---|---|---|
| 源泉徴収票 | ¥63,973,440 | ¥95,832,023 |
| Stored payslips | ¥56,740,340 | ¥73,348,816 |
| **Unaccounted** | **¥7,233,100** | **¥22,483,207** |

All twelve monthly payslips are stored for both years, so both gaps are bonus statements not yet
supplied. The app reports them as unaccounted and never estimates or apportions the difference.

### Residency

Both returns declare **非永住者 (non-permanent resident)** status for the full year, with entry to
Japan on 2023-10-09. Foreign-source income declared was ¥31,926,253 (2024) and ¥30,777,345 (2025),
of which ¥23,072,388 and ¥22,579,600 respectively were paid in or remitted to Japan.

---

## Scope

Centsible verifies that a payslip is internally consistent. It does **not** verify the withholding
amounts against Japanese tax law. That requires the 源泉徴収税額表 for the relevant year and the
published rate schedule of the applicable 健康保険組合, neither of which is bundled here.
