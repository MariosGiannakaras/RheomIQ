# MyFinHub status

## v1.2.1 patch release

MyFinHub is a private, single-owner personal finance application. Production deploys from `main` to Vercel and uses Supabase/PostgreSQL as the durable finance store. Compatibility-critical historical identifiers such as `RheomIQ`, `rheomiq_*` and `RHEOMIQ_*` remain intentionally unchanged where they are persistence/protocol contracts.

This patch release is tracked by issue #206 and fixes the Windows desktop startup defect discovered during normal v1.2.0 use.

- production baseline entering the patch: **v1.2.0**
- production baseline commit: `main@5f9accec7d04825c2ce78ada1d173088d76534d1`
- validated implementation PR: **#215**
- integration commit: `develop@1029e7fe0ac45448ecf73a5f47913ab5bc8995e1`
- release target: **v1.2.1**
- release tracker: **#206**

## Confirmed Windows root cause

The v1.2.0 installed Electron host could remain alive while its bundled Node backend exited before readiness. The packaged `server.mjs` was an esbuild ESM bundle containing CommonJS Express dependencies; `debug` attempted `require('tty')`, but the ESM bundle did not provide a real Node `require`, causing:

`BACKEND_EXITED_DURING_STARTUP → Dynamic require of "tty" is not supported`

The old Windows smoke checked the Electron process rather than the hidden backend process, so this backend failure could be reported as a successful package launch.

## v1.2.1 corrections

PR #215 makes the Windows startup boundary diagnosable, recoverable and directly testable:

- the desktop ESM backend bundle now provides `createRequire(import.meta.url)` so CommonJS dependencies can resolve Node built-ins under the bundled Node.js 22 runtime;
- backend startup stdout/stderr is captured in bounded, in-memory diagnostics rather than discarded;
- startup failures use stable stage/code classifications for configuration, Supabase preflight, secure storage/DPAPI, runtime/bundle, backend spawn/exit/timeout and window load;
- the first-run setup performs an HTTPS Supabase URL/publishable-key preflight before persisting configuration;
- failed startup returns to the setup window for correction/retry rather than forcing a quit/reinstall loop;
- setup progress is driven by real Electron-main startup stages;
- users can copy structured diagnostics whose credentials/tokens/card-vault key material are redacted;
- post-readiness runtime detail is intentionally excluded from copyable failure diagnostics;
- the dedicated **Windows First Run** workflow installs the real NSIS package, consumes persisted first-run configuration, exercises Electron `safeStorage` / Windows DPAPI and requires a live packaged `node.exe → server.mjs --serve-dist` backend;
- the general **Windows Desktop** workflow now requires the same live bundled backend for unpacked and installed launches, preventing an Electron-only false positive.

## Exact implementation validation

Final PR #215 head: `a84120333e326648fff6d48775eecdafed9ba748`.

- CI #839: success — root/API checks, tests, TypeScript/Vite build, bundle budgets and Primary-Chromium rendered QA;
- CodeQL #793: success;
- Cross-engine/WebKit #126: success;
- Performance #120: success;
- Windows First Run #10: success — real install, persisted config, DPAPI-protected secret storage, live packaged backend and uninstall;
- Windows Desktop #489: success — unpacked/installed live-backend assertions, package/install/launch/uninstall/checksum/evidence;
- unresolved PR review threads before merge: zero.

## Security and finance invariants

The patch does not change finance data, accounting rules, authentication authorization or database schema.

- browser/Windows HttpOnly-cookie sessions and same-origin mutation checks remain intact;
- configured owner UID and mandatory TOTP/AAL2 remain required;
- Supabase RLS/RPC and optimistic revision checks remain authoritative;
- approved native Android bearer routes remain explicitly scoped and fail closed;
- no service-role/secret credential is introduced into normal web/desktop/native runtime code;
- PAN/expiry remain in the existing owner+AAL2 encrypted server vault;
- CVV remains encrypted device-local only and is rejected by server persistence;
- receipt images/OCR remain device-local under the existing local-only OCR contract;
- no database migration, destructive historical-data rewrite or accounting-model change is part of v1.2.1.

## Windows desktop contract

Electron owns the Windows application and starts the existing Express backend as a hidden child process using the bundled Node.js 22 runtime. The backend binds only to `127.0.0.1` on an OS-selected ephemeral port and serves the packaged Vite frontend from the same local origin.

Renderer Node access remains disabled; context isolation, sandboxing, navigation restrictions and desktop security headers remain enabled. Desktop uses the same Supabase project, owner login, mandatory TOTP AAL2, RLS/RPC and optimistic revision rules as the web application.

Desktop releases use `myfinhub-v<semver>` tags already present on `main`. The release workflow builds the installer, verifies package/runtime behavior, creates SHA-256 metadata and publishes the controlled GitHub Release. Personal-use builds may be unsigned and can trigger SmartScreen / Unknown publisher warnings.

## v1.2.1 release gates

The implementation validation above is supporting evidence. The release-prep tree must independently pass the current applicable exact-head gates after the `1.2.1` version/documentation metadata is applied:

- root/API installs, audits, security guard, full test suite, TypeScript/Vite build, bundle budgets and API checks;
- Primary-Chromium rendered frontend QA;
- CodeQL;
- Cross-engine/WebKit;
- Performance/loading-shift smoke where configured;
- Windows Desktop package/install/launch/uninstall/checksum with live-backend assertions;
- Windows First Run persisted-config/DPAPI/live-backend gate;
- zero unresolved review threads on the unchanged release-prep head.

After release-prep is squash-merged into `develop`, a separate controlled `develop → main` PR is validated. Production deployment provenance and live API/security behavior must resolve to the exact resulting `main` commit before `myfinhub-v1.2.1` and its Windows installer/checksum are considered complete.

## Delivery workflow

Implementation work follows **Issue → short-lived branch → PR → required checks → squash merge into `develop`**. Production release is a separate deliberate `develop → main` PR followed by production verification. After release, `develop` is synchronized to the exact released `main` baseline only after verifying that no tree content is lost.
