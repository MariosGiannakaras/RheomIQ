# MyFinHub repository rules

- MyFinHub is a **single-owner** personal finance application. The GitHub repository and compatibility-critical internals may retain the historical RheomIQ name; do not rename stable database/migration/protocol identifiers merely for branding.
- Do not add user selection, teams, tenant switching, roles UI, public registration, or multi-user product features.
- Production authentication is email/password plus mandatory TOTP MFA. Finance access must require the configured owner UID and an `aal2` session at both the API and PostgreSQL RLS boundaries.
- Do not add Google/social OAuth, SSO, magic-link login, phone auth, or another identity provider unless the owner explicitly requests that architectural change. No alternate login path may bypass the mandatory MFA boundary.
- Personal financial data and credentials must never be committed. The legacy compatibility path `data/rheomiq-data.json` remains ignored.
- The online runtime must not require `SUPABASE_SECRET_KEY` or service-role credentials. Browser-facing and approved native finance requests use the publishable key plus the authenticated owner's JWT and PostgreSQL RLS. Admin/secret keys are offline emergency tooling only and must never be configured as `VITE_*` variables or embedded in native clients.
- Windows desktop users must not be asked to provision infrastructure configuration. The canonical Supabase project URL and publishable key are application-owned public client configuration and may be packaged in a controlled desktop release; service-role/secret credentials must never be packaged.
- `CARD_VAULT_KEY` is server-side encryption material and must never be embedded in the Windows installer, Electron ASAR, renderer bundle, runtime defaults, Android package, or other distributed client. Windows PAN/expiry operations must use the reviewed production `/api/card-secrets` bearer boundary so encryption/decryption remains server-side.
- Every finance read/write/import/backup/card-secret path must require an authenticated session and database owner authorization. Ambient-cookie state-changing HTTP endpoints must enforce same-origin/CSRF checks and bounded JSON request sizes. An explicitly reviewed native bearer path may skip browser Origin metadata only after bearer authentication succeeds; it must remain owner + AAL2 + RLS/RPC protected and must not relax CORS.
- Production browser/Windows authentication tokens must remain HttpOnly cookies. Never persist finance data, access tokens, refresh tokens, or TOTP enrollment secrets in browser localStorage/IndexedDB. Native-client token storage is a separate platform boundary and must use OS-backed secure storage rather than browser-storage rules.
- Native bearer authentication must be explicit opt-in per approved finance endpoint, fail closed on malformed/rejected bearer credentials without cookie fallback, and preserve session provenance so bearer failures do not clear unrelated browser cookies.
- Browser auth/session/MFA endpoints remain cookie-oriented unless a separately reviewed change explicitly expands them.
- Database authorization must remain RLS-backed and migrations must remain version-controlled in `supabase/migrations/`. Do not introduce `SECURITY DEFINER` authenticated RPCs unless a documented security review proves they are necessary.
- Preserve optimistic revision conflict checks, pre-import backups, bounded backup retention, and append-only write audit events.
- Do not expose raw upstream/database errors to the client. Return stable public error codes/messages and log a request ID server-side for unexpected failures.
- Desktop startup diagnostics may surface bounded operational detail only after credential/token redaction. Never discard all backend stderr on startup, but never expose raw secrets merely to improve diagnostics.
- Preserve the ledger invariant: internal transfers, withdrawals, savings transfers, card payments, and reconciliation adjustments do not become ordinary spending.
- `saving_cash_offset` means **only** a bank transfer from payroll/current account to savings. Physical cash is contextual justification and must not receive a ledger leg.
- Smart Review is advisory. A suggestion must not change reports until the user explicitly confirms it. `kept` means preserve legacy semantics.
- A credit-card purchase is spending; paying the credit-card liability is not spending again.
- Lending creates a receivable asset. Repayment reduces that asset. Net worth includes receivables.
- Split transactions must balance to the parent amount before save.
- Reconciliation edits must calculate against the balance excluding the reconciliation event being edited.
- UI motion must respect `prefers-reduced-motion`; interaction state cannot be conveyed only by motion or color.
- CI/security checks are production gates. Keep tests, dependency audit, CodeQL, Dependabot, and security headers working when changing the app.

## Delivery workflow

- Implementation, infrastructure, dependency-policy, and database changes start from a tracked GitHub issue unless they are an emergency security fix.
- `develop` is the integration branch for routine work. Once `develop` exists, normal feature/fix/chore branches start from `develop` and return through a pull request targeting `develop`.
- `main` is release-only. Accumulate a coherent milestone on `develop`, then open a `develop -> main` release PR when the batch is ready for production.
- Automatic Vercel Git deployments are intentionally disabled for every branch except `main`; non-main PRs are validated by CI, CodeQL, and rendered frontend QA without consuming Vercel deployment quota. Create a manual preview only when a specific change genuinely requires deployment-level validation.
- A merge to `main` is the normal automatic production deployment trigger. Keep the event-driven Production Smoke gate tied to that production deployment and verify the deployed SHA matches the release commit.
- Emergency security or production hotfixes may branch from `main` and target `main` directly when necessary. After the hotfix is released, synchronize the resulting `main` commit back into `develop` before continuing routine work.
- Use short-lived branches named `feat/<issue>-<slug>`, `fix/<issue>-<slug>`, `chore/<issue>-<slug>`, or `security/<issue>-<slug>`. Never implement directly on `main`.
- Every implementation branch returns through a pull request that links the issue with `Closes #<issue>`, states scope and risk, and completes the repository PR checklist.
- Do not merge while required CI, CodeQL, Supabase migration checks, or relevant release/deployment checks are failing or pending.
- Prefer squash merge for a single clear change history. Delete merged branches and do not leave abandoned implementation branches or unresolved review threads.
- Major dependency upgrades require an explicit compatibility review; do not merge them solely because Dependabot opened a PR.
- Database DDL changes are made only through ordered files in `supabase/migrations/`. Never make an untracked production schema change and leave Git behind.
- Production data is used only by the production runtime. Preview/development deployments must not receive credentials or configuration that can mutate the production finance database unless that access is explicitly reviewed and intended.
- Before merging backend/auth/database changes, verify authorization failure paths as well as the successful path. Before merging finance-domain changes, run the domain regression suite and preserve the invariants above.