# Changelog

All notable MyFinHub changes are recorded here. Release artifacts remain available from [GitHub Releases](https://github.com/MariosGiannakaras/MyFinHub/releases).

## [Unreleased]

## [1.2.1] - 2026-08-22

### Fixed

- Fixed the installed Windows desktop backend crash that could occur immediately after valid first-run configuration. The esbuild ESM `server.mjs` bundle now provides a Node `createRequire(import.meta.url)` bridge so Express/CommonJS dependencies can resolve Node built-ins such as `tty` under the bundled Node.js 22 runtime.
- Replaced the generic local-service startup failure with structured stage/error codes and bounded startup diagnostics, preserving the actual backend cause instead of discarding `stderr`.
- Failed desktop startup now returns to the first-run/setup window for correction and retry rather than forcing an opaque quit/reinstall loop.
- Added a real HTTPS Supabase URL/publishable-key preflight before first-run configuration is persisted.
- Hardened Windows CI so a live Electron process is no longer sufficient: both unpacked and installed package smoke require the bundled `node.exe → server.mjs --serve-dist` backend to be running.

### Security & privacy

- Copyable startup diagnostics redact Supabase keys, bearer/JWT values and card-vault key material and remain bounded/in-memory; post-readiness runtime detail is intentionally omitted from copyable failure diagnostics.
- Electron renderer sandboxing, context isolation, loopback-only backend binding, HttpOnly-cookie/same-origin desktop session behavior, owner+AAL2 authorization, Supabase RLS/RPC, optimistic revisions and card-vault boundaries remain unchanged.
- No finance-data/schema migration, accounting rewrite or new runtime secret is introduced.

### Validation

- Fix PR #215 final head `a84120333e326648fff6d48775eecdafed9ba748` passed CI #839, CodeQL #793, Cross-engine/WebKit #126 and Performance #120 with zero unresolved review threads.
- Windows First Run #10 passed a real NSIS install → persisted first-run configuration → Electron safeStorage/Windows DPAPI → live packaged backend → uninstall path without runtime Supabase/card-vault environment injection.
- Windows Desktop #489 passed strengthened unpacked and installed launch checks that require the real packaged backend, plus NSIS install/launch/uninstall, checksum and evidence upload.
- The integrated v1.2.1 release-prep tree is independently revalidated under release tracker #206 before production promotion; implementation-branch results are supporting evidence only.

### Notes

- v1.2.1 is a backward-compatible Windows reliability/security-diagnostics patch over v1.2.0. Web finance behavior, database state and Android bearer API semantics are unchanged.
- Existing v1.2.0 desktop configuration can be reused; the patch does not require a new Supabase project or a card-vault-key rotation.
- The Windows build may remain unsigned for personal use, so Windows can display Unknown publisher / Microsoft Defender SmartScreen; installer integrity remains protected by the controlled release source and published SHA-256 checksum.

## [1.2.0] - 2026-08-22

### Added

- Added explicit category management with normalized Greek/whitespace/case duplicate handling, validated Save actions, dirty/saved feedback and safer vehicle subcategory defaults.
- Added clickable MyFinHub brand/home affordances for sidebar and mobile navigation while preserving the existing routing model and responsive behavior.
- Added a device-local receipt inbox for JPG/PNG camera or file capture. Pending drafts persist in IndexedDB across reload, app close and logout until explicitly handled or deleted.
- Added local-only Greek/English receipt OCR with Tesseract.js 7, pinned `ell`/`eng` data and self-hosted worker/WASM/language assets. OCR is lazy-loaded, bounded and runs without a cloud OCR/LLM/VLM provider.
- Added deterministic receipt proposal parsing for merchant, date, total, currency and conservative existing-category suggestions, handing reviewed values to the existing Quick Entry flow rather than creating a second transaction engine.
- Added an explicitly scoped native bearer authentication contract for the separate Android client on approved finance/card-secret endpoints, using Supabase owner `aal2` access JWTs.

### Changed

- Category editors now use explicit persistence instead of silent blur/timer autosave and reject invalid/empty trees without overwriting the last saved configuration.
- Receipt capture is durable before OCR: OCR may be cancelled or retried later, while normal Quick Entry `Καταχώριση` remains the only transaction creation action and deletes a handled draft only after successful normal submit.
- Non-EUR receipt detection warns and prevents silent EUR amount prefill; MyFinHub accounting remains EUR-only.
- Browser and Windows cookie sessions remain the default session model. Native bearer mode is disabled by default and must be explicitly enabled by an approved route.

### Security & privacy

- Browser/Windows HttpOnly-cookie authentication, same-origin mutation checks, owner UID, mandatory TOTP/AAL2, PostgreSQL RLS/RPC, optimistic revisions, validation, backups and audit behavior remain intact.
- Explicit bearer credentials fail closed and cannot fall back to ambient cookies after rejection. Bearer mutations may omit browser Origin metadata only after bearer authentication succeeds; this does not relax CORS.
- No service-role or Supabase secret credential is introduced into browser, desktop or Android runtime code.
- Receipt images and pending receipt metadata remain device-local IndexedDB state. Raw OCR text is transient and receipt images/raw OCR never enter FinanceData, Supabase, normal backups, Change History or application logs.
- PAN/expiry remain in the existing owner+AAL2 encrypted card vault. CVV remains encrypted device-local only and is forbidden from server persistence.
- No database/schema migration, destructive finance-data rewrite or accounting-model change is introduced by this release.

### Validation

- Navigation/category PR #194 passed exact-head CI #791 with **52 test files / 252 tests**, Primary-Chromium rendered QA, CodeQL #745, Cross-engine/WebKit #84, Performance #78 and Windows Desktop #443, with zero unresolved review threads.
- Native bearer PR #197 passed exact-head CI #801, CodeQL #755, Cross-engine/WebKit #93, Performance #87 and Windows Desktop #453, followed by an exact-diff security review with zero unresolved threads.
- Local receipt OCR PR #195 passed exact-head CI with **56 test files / 267 tests**, dedicated Primary-Chromium receipt lifecycle QA, zero external HTTP requests during OCR recognition, CodeQL, Cross-engine/WebKit, Performance and Windows Desktop validation, with clean review threads.
- The integrated v1.2.0 release head is revalidated independently through issue #199 and its release PR; feature-branch evidence is supporting evidence, not a substitute for final-head gates.

### Notes

- v1.2.0 is a backward-compatible feature release over v1.1.0.
- The Android application remains a separate repository/client. This release supplies the MyFinHub backend authentication contract it requires; it does not move Android application code into this repository.
- Hands-on testing with representative real receipts is outside GitHub engineering tracking and is not a release gate. Reproducible defects discovered during normal use should be filed as focused fixes.
- The Windows build may remain unsigned for personal use, so Windows can display Unknown publisher / Microsoft Defender SmartScreen; installer integrity remains protected by the controlled release source and published SHA-256 checksum.

## [1.1.0] - 2026-08-22

### Added

- Added the broader MyFinHub workspace capability set now integrated on `develop`: first-class internal transfers, split transactions, scheduled transactions, deterministic 30/60/90-day cash-flow forecasting, monthly category budgets, deterministic transaction rules, the **Needs Attention** action center and context-aware Quick Entry.
- Added the restructured Reports/Analytics experience with comparative KPIs, cash-flow/trend views, commitment and credit-pressure indicators, category momentum, responsive drill-downs and a shared deterministic finance-state source of truth.
- Added privacy-safe unified search and Command Palette support across the application without indexing or exposing card secrets/private finance text outside the intended UI boundary.
- Added normalized payment flows across credit cards, loans/installments and recurring obligations so source account, target obligation and result semantics remain consistent while preserving existing accounting rules.
- Added one coherent application-wide keyboard-shortcut system with platform-aware hints: Search/Command Palette (`Ctrl K` / `⌘ K`), Quick Entry (`Ctrl Shift Space` / `⌘ ⇧ Space`), Undo (`Ctrl Z` / `⌘ Z`), Redo (`Ctrl Y` / `⌘ ⇧ Z`, with `Ctrl Shift Z` compatibility) and Escape for the topmost dismissible modal.
- Added a responsive **Keyboard Shortcuts** reference section in Settings and shortcut hints on the relevant controls/tooltips.
- Added privacy-safe session Change History tied to the existing Undo/Redo state stacks, including useful entity/field context and bounded `previous → new` values where safe.

### Changed

- Hardened application-wide UI/UX, accessibility, responsive behavior, modal/focus management, sorting, readability, owned controls and user-facing copy across desktop and narrow/mobile layouts.
- Refined the MyFinHub light/dark visual treatment across browser/PWA/Windows surfaces while preserving the authentic historical wallet/`R` application mark and all compatibility-critical persistence/protocol identifiers.
- Locked the Dashboard semantic/read order to **Μετρητά → Μισθοδοσία → Αποταμίευση → λοιπά υπόλοιπα → εκκρεμή/actionable → Quick Entry → analytics/rest**.
- Expanded route-shaped loading skeletons into high-fidelity compositions for Dashboard, Transactions, Review, Savings, Cards, Credit, Loans, Lending, Recurring, Planning, Attention, Reports and Settings, including representative controls/cards/lists/charts/forms and responsive/reduced-motion behavior.
- Improved skeleton-to-content stability with all-route desktop/mobile loading-overflow and CLS regression auditing while retaining the existing performance threshold.
- Upgraded Change History from generic labels to concise product copy covering additions, edits, deletions, transfers, scheduled items, balances/reconciliation, budgets, rules, cards, loans/installments, recurring items, settings and review/attention decisions.
- Undo and Redo history entries now identify the affected safe change instead of recording only a generic action, without replacing the underlying persistence/state-stack model.
- Removed duplicate legacy `Ctrl/Cmd+K` shortcut listeners so the shared shortcut hook is the single app-wide production authority, with editable-field, modal, repeat/default-prevented and event-propagation guards.

### Security & privacy

- Change History deliberately excludes PAN, expiry secrets, CVV/CVC, vault references, cardholder/private card values, transaction notes/descriptions, custom account names and arbitrary private free-text.
- Existing owner-only authentication, mandatory TOTP AAL2, same-origin mutation protection, PostgreSQL RLS, optimistic revisions, payment-card secret isolation and backup boundaries remain unchanged by this release.
- PAN/expiry continue to use the owner+AAL2 encrypted server card vault; CVV remains encrypted device-local only and is not accepted by server persistence boundaries.
- No destructive finance-data migration, accounting rewrite, alternate login path or new service-role/runtime secret requirement was introduced.

### Validation

- The final v1.1.0 implementation head `7401eb0d4a274e2d367fe0c67ee91f77ca07ca09` passed the complete application/API check path with **51/51 test files and 247/247 tests**, production build and bundle budgets, and app/API dependency audits with zero reported vulnerabilities.
- Primary-Chromium rendered QA passed in CI #782, including keyboard-only shortcut flows, editable/modal conflict handling, Change History privacy assertions, mobile containment and ledger reconciliation; the run published 86 browser-evidence files.
- CodeQL #736, Cross-engine/WebKit #79 and Performance/loading-shift #74 passed on the same exact implementation head.
- Windows Desktop #435 passed the packaged executable smoke, interactive NSIS build, fresh install/launch/uninstall flow, installer/update-channel checksum verification and evidence artifact upload.
- Release-readiness automation continues to cover real Windows installed-package identity, executable/shortcut/uninstall behavior, browser/PWA identity, reduced-motion/loading boundaries and the controlled desktop update channel.

### Notes

- v1.1.0 is a backward-compatible feature release over v1.0.2. It preserves finance/accounting semantics, authentication/security boundaries and existing stored data while substantially expanding planning, reporting and interaction quality.
- Receipt OCR is intentionally **not** part of v1.1.0; the future ephemeral OCR proposal is tracked separately in issue #188.
- The Windows build may remain unsigned for personal use, so Windows can display Unknown publisher / Microsoft Defender SmartScreen; installer integrity remains protected by the controlled release source and published SHA-256 checksum.

## [1.0.2] - 2026-08-20

### Fixed

- Restored the user-supplied Cards v15 prototype as the visual and interaction contract for the Cards workspace instead of redesigning card geometry, bank stacking, icons or core interactions.
- Removed the effective per-bank card cap so any number of active cards can coexist under the same bank.
- Archive/restore now preserves the same card identity and recoverable secret state: PAN/expiry remain in the encrypted server vault and same-device CVV remains in the encrypted local vault instead of being deleted on archive.
- Multiple active credit cards can now coexist with independent per-card limits, debt, available balance, purchases, repayments and history.
- Legacy credit events created before card IDs existed remain financially readable through deterministic backward-compatible attribution; production history is not destructively rewritten.

### Security

- CVV/CVC remains rejected by every server request and persistence boundary and is never written to FinanceData, Supabase, backups, logs or analytics.
- PAN/expiry continue to use the owner + AAL2 encrypted card vault with explicit deletion support.

### Validation

- Added regression coverage for 3+ cards under one bank, multiple active credit identities, per-card credit debt/limits, legacy event attribution and card-state validation.
- The feature branch passed application/API checks, 136 unit/server tests, rendered frontend QA, CodeQL and the real Windows package gate including packaged `MyFinHub.exe` smoke, interactive NSIS Setup and SHA-256 verification.

### Notes

- v1.0.2 changes card persistence/functionality while preserving the supplied Cards presentation contract. The only conditional credit-page UI addition is a selector when more than one credit card exists, because a target card must be chosen for per-card debt and transactions.
- The Windows build remains unsigned for personal use, so Windows may display Unknown publisher / Microsoft Defender SmartScreen.

## [1.0.1] - 2026-08-20

### Changed

- Restored the authentic original wallet/`R` application mark from pre-rebrand repository history across browser, PWA, setup and Windows packaging assets.
- Replaced the repository README with an application-style landing page containing a prominent Windows download, release links, checksum access, installation instructions and user-facing feature overview.
- Added this maintained changelog and documented the provenance of the authentic application artwork.

### Notes

- v1.0.1 is a branding/documentation patch over v1.0.0; finance data, database schema and authentication boundaries are unchanged.
- The Windows build remains unsigned for personal use, so Windows may display Unknown publisher / Microsoft Defender SmartScreen.

## [1.0.0] - 2026-08-19

### Added

- First controlled MyFinHub Windows desktop release.
- Interactive NSIS installer producing `MyFinHub-Setup-1.0.0-x64.exe`.
- Standalone `MyFinHub.exe` Electron host with bundled Node.js runtime and hidden local Express backend.
- First-run desktop configuration flow for Supabase connectivity and optional card-vault key import.
- Controlled in-app desktop updater backed by GitHub Releases with exact installer/checksum asset matching and SHA-256 verification.
- Shared Cards/Credit identity, credit-card workspace, loans/installments flows and recurring finance integration.
- MyFinHub visible product naming across the web/PWA and Windows desktop surfaces while retaining compatibility-critical legacy persistence/protocol identifiers.

### Security

- Owner-only finance access remains protected by Supabase Auth, mandatory TOTP MFA/AAL2 checks and PostgreSQL RLS.
- PAN/expiry remain in the ciphertext-only card vault; CVV remains device-local.
- Windows release validation includes packaged executable startup/backend smoke, NSIS Setup build and installer checksum verification.

### Notes

- v1.0.0 is an unsigned personal-use Windows build. Windows may display Unknown publisher / Microsoft Defender SmartScreen.

[Unreleased]: https://github.com/MariosGiannakaras/MyFinHub/compare/myfinhub-v1.2.1...develop
[1.2.1]: https://github.com/MariosGiannakaras/MyFinHub/releases/tag/myfinhub-v1.2.1
[1.2.0]: https://github.com/MariosGiannakaras/MyFinHub/releases/tag/myfinhub-v1.2.0
[1.1.0]: https://github.com/MariosGiannakaras/MyFinHub/releases/tag/myfinhub-v1.1.0
[1.0.2]: https://github.com/MariosGiannakaras/MyFinHub/releases/tag/myfinhub-v1.0.2
[1.0.1]: https://github.com/MariosGiannakaras/MyFinHub/releases/tag/myfinhub-v1.0.1
[1.0.0]: https://github.com/MariosGiannakaras/MyFinHub/releases/tag/myfinhub-v1.0.0
