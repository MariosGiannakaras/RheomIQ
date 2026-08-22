<p align="center">
  <img src="assets/branding/myfinhub/icon-192.png" width="128" alt="MyFinHub authentic application mark" />
</p>

<h1 align="center">MyFinHub</h1>
<p align="center"><strong>Smart. Clear. In Control.</strong></p>
<p align="center">Private, single-owner personal finance workspace for Windows, web and mobile.</p>

<p align="center">
  <a href="https://github.com/MariosGiannakaras/MyFinHub/releases/download/myfinhub-v1.2.1/MyFinHub-Setup-1.2.1-x64.exe"><img alt="Download MyFinHub for Windows" src="https://img.shields.io/badge/Download%20for%20Windows-v1.2.1-2563EB?style=for-the-badge&logo=windows11&logoColor=white"></a>
  <a href="https://github.com/MariosGiannakaras/MyFinHub/releases/latest"><img alt="Latest release" src="https://img.shields.io/badge/Release-v1.2.1-0F766E?style=for-the-badge"></a>
  <a href="CHANGELOG.md"><img alt="Changelog" src="https://img.shields.io/badge/Changelog-View-475569?style=for-the-badge"></a>
</p>

<p align="center">
  <a href="https://github.com/MariosGiannakaras/MyFinHub/releases">All releases</a> ·
  <a href="https://github.com/MariosGiannakaras/MyFinHub/releases/tag/myfinhub-v1.2.1">v1.2.1 release notes</a> ·
  <a href="https://github.com/MariosGiannakaras/MyFinHub/releases/download/myfinhub-v1.2.1/MyFinHub-Setup-1.2.1-x64.exe.sha256">SHA-256</a> ·
  <a href="docs/WINDOWS_DESKTOP.md">Windows documentation</a>
</p>

> **Windows release:** download only `MyFinHub-Setup-1.2.1-x64.exe`. You do not need to clone or download the repository. The current personal-use build may be unsigned, so Windows can display **Unknown publisher / Microsoft Defender SmartScreen**. Installer integrity is protected by the published SHA-256 checksum and controlled GitHub Release channel.

## Download and install

1. Click **Download for Windows** above.
2. Run `MyFinHub-Setup-1.2.1-x64.exe`.
3. Choose the installation folder if desired; Setup creates Start Menu and Desktop shortcuts.
4. On first launch, complete the MyFinHub setup window for the shared Supabase connection.
5. Use **Ρυθμίσεις → Ενημερώσεις** for future desktop update checks.

The installed application contains its own Electron host, bundled Node.js runtime and local backend. Normal use does not require Git, Node.js, a terminal or a browser.

The v1.2.1 desktop startup path validates the Supabase connection before saving first-run configuration. If the local backend cannot start, the setup window remains available with a structured error code/stage, safe redacted diagnostics and retry/edit capability rather than closing with a generic failure.

## What MyFinHub manages

- **Dashboard:** ordered balances, net worth, spending, savings, receivables, actionable items and Quick Entry. The MyFinHub brand control returns directly to Dashboard on desktop and mobile layouts.
- **Transactions:** income, expenses, internal transfers, withdrawals, refunds, split transactions and reconciliation.
- **Categories:** explicit validated category/subcategory management with normalized duplicate prevention and app-wide availability after Save.
- **Receipt capture & OCR:** camera/file JPG/PNG capture into a device-local pending inbox, Greek/English local OCR and deterministic reviewed suggestions into the existing Quick Entry flow. Receipt images and raw OCR are not cloud-synced or stored in FinanceData.
- **Savings:** cash-offset saving and savings-account movements without corrupting spending totals.
- **Recurring:** repeated obligations and long-term payment flows.
- **Cards & credit:** unlimited cards per bank, protected PAN/expiry storage, same-device CVV recovery across archive/restore, and independent limits/debt/history for multiple credit cards.
- **Loans & lending:** personal loans, installments, receivables and repayment history with normalized payment flows.
- **Planning:** scheduled transactions and deterministic 30/60/90-day cash-flow forecasting.
- **Budgets & rules:** monthly category budgets plus deterministic transaction categorization rules.
- **Needs Attention:** one action center for finance items that require review or follow-up.
- **Review:** controlled proposals that do not affect reports until confirmed.
- **Reports:** comparative KPIs, flow/trend views, commitment/credit pressure, category momentum and responsive drill-downs from the canonical finance state.
- **Search & Command Palette:** privacy-safe navigation/search with app-wide keyboard shortcuts.
- **Autosave + Undo/Redo + Change History:** normal edits persist automatically while remaining reversible, with session-only privacy-safe descriptions of recent changes.

## Keyboard shortcuts

MyFinHub exposes the same shortcut model throughout the application and documents it in **Settings → Keyboard Shortcuts**.

- Search / Command Palette: `Ctrl K` on Windows/Linux, `⌘ K` on Apple platforms.
- Quick Entry: `Ctrl Shift Space` / `⌘ ⇧ Space`.
- Undo: `Ctrl Z` / `⌘ Z`.
- Redo: `Ctrl Y` on Windows/Linux, `⌘ ⇧ Z` on Apple platforms; `Ctrl Shift Z` is also accepted where appropriate.
- Escape dismisses the topmost app modal/overlay through the existing focus-management boundary.

App shortcuts do not steal native editing keystrokes from focused editable controls.

## One finance state, multiple clients

MyFinHub clients use the same canonical Supabase/PostgreSQL finance state:

- **Web/mobile browser:** React/Vite with Node API routes on Vercel.
- **Windows desktop:** Electron with the existing Express backend running locally on `127.0.0.1`.
- **Native Android integration:** the separate Android repository may consume the approved finance API through the explicitly scoped bearer contract documented in [`docs/ANDROID_NATIVE_API.md`](docs/ANDROID_NATIVE_API.md). Android code is not maintained in this repository.

Changes made through an authorized client synchronize through the shared database. Application updates are separate from finance-data synchronization.

## Security and privacy

MyFinHub is intentionally a **single-owner** application. Supabase Auth uses email/password plus mandatory TOTP Authenticator MFA. Finance access requires the configured owner UID and an `aal2` session in both API authorization and PostgreSQL RLS.

Browser and Windows sessions retain the HttpOnly/Secure cookie model and same-origin mutation protection. Approved native finance/card-secret routes may explicitly opt into `Authorization: Bearer <Supabase access JWT>` for native clients; rejected bearer credentials fail closed without ambient-cookie fallback, and the same owner/AAL2/RLS/revision rules remain mandatory. This native path does not add permissive CORS and never uses a service-role credential.

The online runtime uses the Supabase publishable key, never a service-role secret. Full PAN/expiry use a separate ciphertext-only card vault; CVV remains encrypted device-local state and is never included in ordinary finance backups or accepted by server persistence.

Receipt capture/OCR is local-only: pending images live in device-local IndexedDB, OCR uses self-hosted Tesseract worker/WASM/Greek-English language assets, raw OCR text is transient, and receipt content is not written to FinanceData, Supabase, normal backups, Change History or application logs.

Change History is session-only and deliberately excludes PAN, expiry secrets, CVV/CVC, vault references, transaction notes/descriptions and arbitrary private free-text.

Desktop updates are accepted only from the controlled MyFinHub GitHub Release channel. The app requires the exact versioned installer and `.sha256` asset pair, validates trusted GitHub URLs and verifies the downloaded installer hash before installation.

## Authentic branding

The application mark in this repository is the **original project artwork**, recovered byte-for-byte from the pre-rebrand Git history. It is the blue wallet with the `R` mark used by the original RheomIQ application. MyFinHub keeps that authentic mark while the visible product name remains **MyFinHub**.

`assets/branding/myfinhub/icon-192.png` is the historical 192×192 source-of-truth. The 32×32 favicon and 512×512 Windows/PWA variants are deterministic size derivatives of that source; they are not replacement artwork or a newly invented `MF` logo.

Compatibility-critical historical identifiers such as `rheomiq_*` database objects and `RHEOMIQ_*` desktop/backend protocol variables remain intentionally unchanged because they are persistence/protocol contracts, not visible product branding.

## Accounting model

MyFinHub preserves the existing Excel-derived behavior rather than flattening everything into generic income/expense rows:

- **Cash-offset saving:** payroll/current → savings; physical cash is untouched. Counts as savings, not spending.
- **Withdrawals:** bank → cash; no income/expense.
- **Internal transfers:** balance movement only.
- **Refunds:** reduce spending.
- **Credit card:** purchase is spending; card payment is liability repayment. Each credit card keeps independent debt/limit/history while the aggregate ledger remains backward-compatible.
- **Lending:** creates a receivable; repayment reduces it; net worth includes receivables.
- **Reconciliation:** balance correction without polluting spending.
- **Splits:** category parts must balance to the parent amount.
- **Scheduled items:** do not affect current balances until explicit completion.
- **Smart Review:** proposals affect reports only after confirmation.

## Updates and release history

The current stable Windows release is **v1.2.1**. See [`CHANGELOG.md`](CHANGELOG.md) for released and unreleased changes, or browse the complete [GitHub Releases](https://github.com/MariosGiannakaras/MyFinHub/releases) history.

Desktop releases use `myfinhub-v<version>` tags. The Windows release workflow verifies that the tag is already on `main`, builds and smoke-tests `MyFinHub.exe`, creates the interactive NSIS installer, generates SHA-256 metadata and publishes the controlled GitHub Release.

## Development

<details>
<summary>Local development and architecture details</summary>

### Requirements

Node.js 22 LTS.

### Web/local server

```bash
npm ci
npm run dev
```

### Windows desktop development

```bash
npm ci
npm ci --prefix desktop
npm run desktop:dev
```

### Validation

```bash
npm run test
npm run build
npm run check
```

### Runtime environment

Online/Vercel runtime:

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Desktop/local PAN + expiry access additionally uses the existing vault key:

```text
CARD_VAULT_KEY=<64 hex chars or Base64 decoding to 32 bytes>
CARD_VAULT_KEY_VERSION=1
```

Offline emergency migration/verification may additionally use `SUPABASE_SECRET_KEY`. Never configure that secret in Vercel/Electron runtime and never expose it as `VITE_*`.

### Persistence

SQL schema changes are version-controlled under `supabase/migrations/`. The compatibility `FinanceData` document remains the canonical read/import representation. Normal saves use optimistic revision locking so a stale client cannot silently overwrite newer state.

### Delivery workflow

**Issue → short-lived branch → Pull Request → CI/CodeQL/relevant platform gates → squash merge to `develop`.**

`main` is release-only. Deliberate `develop → main` releases promote coherent batches to production. Windows changes also pass the real-Windows package gate before release.

</details>

## Repository structure

```text
MyFinHub/
├─ api/                      # Vercel Auth + finance API routes
├─ assets/branding/myfinhub/ # canonical authentic application artwork
├─ desktop/                  # Electron Windows host + setup/update tooling
├─ public/brand/             # runtime web/PWA/desktop icons
├─ src/                      # React UI + finance domain logic
├─ server/                   # auth, HTTP validation and Supabase adapters
├─ scripts/                  # migration/verification utilities
├─ supabase/migrations/      # PostgreSQL schema source of truth
├─ tests/                    # finance, security and desktop regressions
├─ docs/                     # architecture, Windows desktop and UX rules
├─ CHANGELOG.md
└─ .github/                  # CI, CodeQL, Dependabot + Windows release workflow
```

Personal finance payloads and credentials are excluded from Git history.
