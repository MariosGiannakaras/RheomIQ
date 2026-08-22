# MyFinHub for Windows

## Runtime model

The Windows edition is a packaged desktop client, not a PWA and not a shortcut to Vercel.

- Electron owns the native `MyFinHub` application window, executable and Windows shortcuts.
- A bundled **Node.js 22.x** executable starts the existing Express backend as a hidden child process.
- The local backend binds only to `127.0.0.1` on an operating-system-selected ephemeral port. It is started by the desktop host and stopped with the application.
- The packaged Vite build is served from that local backend, preserving the same-origin HttpOnly-cookie boundary used by the existing local runtime.
- The backend talks directly to the canonical Supabase project through the application-owned public project URL + publishable key, authenticated owner JWT and PostgreSQL RLS.
- Service-role/secret credentials are never embedded in the desktop package.
- Owner identity and mandatory TOTP `aal2` remain required for finance reads/writes.

The Vercel application remains the canonical production API/web client. Desktop and web are two clients of the same canonical Supabase state and optimistic revision model.

Compatibility-critical legacy internal names such as `RHEOMIQ_DESKTOP_READY`, other `RHEOMIQ_*` local-backend environment variables and existing `rheomiq_*` database objects intentionally remain unchanged. They are protocol/persistence identifiers, not visible product branding.

## No technical first-run setup

A normal installed user is **not** asked for Supabase URLs, API keys, encryption keys or other infrastructure values.

`SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are public client configuration owned by the application and packaged with the controlled Windows release. They are not credentials and are not entered by the user.

`CARD_VAULT_KEY` is a real server-side encryption secret and must **never** be packaged with the Windows client. Desktop PAN/expiry operations use the existing protected production `/api/card-secrets` boundary with the already authenticated owner `aal2` access token. The production server performs vault encryption/decryption, so the Windows application never needs or receives the vault key.

CVV remains device-local only and never enters the server-side desktop or production card-vault boundary.

## Startup recovery and diagnostics

A healthy fresh installation starts the local backend and opens the normal MyFinHub login directly.

If startup fails, MyFinHub opens a non-technical recovery window instead of asking for infrastructure configuration. The recovery surface provides:

- a stable diagnostic code and startup stage;
- bounded, sanitized backend detail;
- retry without reinstalling;
- copyable diagnostics for debugging.

Local backend stdout/stderr diagnostics are bounded and redacted before display/copy. Supabase keys, bearer/JWT credentials and encryption-key-shaped values are removed from diagnostics.

## What synchronizes automatically

**Finance data synchronizes through Supabase; installed application code is updated through desktop releases.**

Transactions, balances, cards, settings and the rest of the finance state use the shared Supabase database. A successful save from desktop or web writes the same canonical state. Optimistic revisions prevent a stale already-open client from silently overwriting a newer save.

The React bundle, Electron host and local Express backend are intentionally local so ordinary desktop UI/backend execution does not depend on Vercel. The exception is protected PAN/expiry card-vault operations, which intentionally traverse the canonical production API so the card-vault encryption key remains server-side.

## Normal installation

The release artifact is a standard interactive NSIS installer:

```text
MyFinHub-Setup-<version>-x64.exe
```

It installs per Windows user by default, creates **Desktop** and **Start Menu** shortcuts and launches MyFinHub when installation finishes. The executable is `MyFinHub.exe` and the desktop identity is `app.myfinhub.desktop`.

Normal users install once and then sign in with the same MyFinHub email/password + TOTP flow used by the web application. No terminal, Git, Node.js, browser or infrastructure setup is required.

## In-app updates

A packaged MyFinHub installation checks the controlled GitHub Release channel automatically after startup and periodically while running. Automatic checks **do not** force a download or installation.

The Windows section in **Ρυθμίσεις** exposes the current version and update state. When a newer release is available the user explicitly chooses:

1. **Λήψη ενημέρωσης**
2. after verification, **Εγκατάσταση & επανεκκίνηση**

The updater accepts only a tightly controlled release shape:

- release tag `myfinhub-v<semver>`;
- exact asset `MyFinHub-Setup-<version>-x64.exe`;
- exact companion `MyFinHub-Setup-<version>-x64.exe.sha256`;
- GitHub/release-asset HTTPS hosts only;
- bounded installer size;
- streamed SHA-256 verification before the installer can become ready.

It never accepts an arbitrary update URL or an unverified binary. Update progress is shown in-app and on the Windows taskbar. Installation closes the running app only after verification, starts the installer and then relaunches MyFinHub.

## Unsigned personal-use releases

A paid Windows code-signing certificate is **not required** for this personal-use application. The release workflow supports unsigned builds and records that fact explicitly. The tradeoff is normal Windows reputation behavior: an unsigned build may show **Unknown publisher** or Microsoft SmartScreen, particularly on first installation or after a new build.

Authenticode signing remains optional. If both signing repository secrets are later configured, the same workflow signs and verifies the installer before publishing it. Partial signing configuration fails the release rather than silently falling back.

Integrity for both signed and unsigned updates is still enforced by the controlled GitHub Release source, strict naming/allowlisting and SHA-256 verification described above.

## Release workflow

`.github/workflows/desktop-windows.yml` validates the Windows package on a real `windows-latest` runner. The intended patch-release gate includes:

- deterministic root + desktop dependency installation;
- security/test/build gates;
- unpacked Windows package build;
- real `MyFinHub.exe` hidden-backend smoke;
- clean installed-user launch with application-owned public configuration and no runtime environment-variable provisioning bypass;
- remote desktop card-vault boundary tests;
- interactive NSIS Setup build;
- install/launch/uninstall validation;
- installer size/checksum validation;
- short-retention installer/checksum evidence.

A public desktop release is produced only from a tag such as:

```text
myfinhub-v1.2.1
```

The tagged commit must already be present on `main` and the tag version must match `desktop/package.json`. The release then publishes the installer plus its `.sha256` companion.

## Source-build fallback

The repository keeps a fallback bootstrap for development/recovery:

```text
INSTALL_MYFINHUB_WINDOWS.bat
```

This can build/install the checked-out source and can locate or download a verified Node.js 22 build runtime. It is **not** required for ordinary released installations.

The fallback `--latest` mode remains available for recovery or machines where the application cannot start:

```text
INSTALL_MYFINHUB_WINDOWS.bat --latest
```

Normal users should use `MyFinHub-Setup-*.exe` once and then the in-app updater.

## Development and generated files

Windows desktop development:

```text
npm ci
npm ci --prefix desktop
npm run desktop:dev
```

Generated packaging output remains outside Git:

```text
desktop/.build/
release/desktop/
```

Canonical MyFinHub brand assets used by browser/PWA/desktop builds are kept under:

```text
assets/branding/myfinhub/
```
