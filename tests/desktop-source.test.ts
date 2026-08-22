import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relative:string) => fs.readFileSync(path.join(root, relative), 'utf8');
const bytes = (relative:string) => fs.readFileSync(path.join(root, relative));
const exists = (relative:string) => fs.existsSync(path.join(root, relative));

const desktopPackage = JSON.parse(read('desktop/package.json'));
const bootstrap = read('desktop/bootstrap.cjs');
const defaults = read('desktop/runtime-defaults.cjs');
const main = read('desktop/main.cjs');
const preload = read('desktop/preload.cjs');
const recovery = read('desktop/setup.html');
const recoveryRenderer = read('desktop/setup-renderer.js');
const settings = read('src/pages/SettingsPage.tsx');
const updatePanel = read('src/components/DesktopUpdatePanel.tsx');
const workflow = read('.github/workflows/desktop-windows.yml');
const prepareBuild = read('desktop/prepare-build.mjs');
const vaultHandler = read('server/cardVaultHandler.ts');
const vaultProxy = read('server/desktopCardVaultProxy.ts');

function mainBlock(start:string,end:string){const from=main.indexOf(start);const to=main.indexOf(end,from+start.length);expect(from).toBeGreaterThanOrEqual(0);expect(to).toBeGreaterThan(from);return main.slice(from,to);}

describe('MyFinHub Windows desktop boundary', () => {
  it('uses a native MyFinHub application identity and interactive per-user NSIS installer', () => {
    expect(desktopPackage.build.productName).toBe('MyFinHub');
    expect(desktopPackage.build.appId).toBe('app.myfinhub.desktop');
    expect(desktopPackage.build.win.executableName).toBe('MyFinHub');
    expect(desktopPackage.build.win.artifactName).toBe('MyFinHub-Setup-${version}-${arch}.${ext}');
    expect(desktopPackage.build.nsis.oneClick).toBe(false);
    expect(desktopPackage.build.nsis.perMachine).toBe(false);
    expect(desktopPackage.build.nsis.allowToChangeInstallationDirectory).toBe(true);
    expect(desktopPackage.build.nsis.createDesktopShortcut).toBe('always');
    expect(desktopPackage.build.nsis.createStartMenuShortcut).toBe(true);
    expect(desktopPackage.main).toBe('bootstrap.cjs');
    expect(main).toContain("const PRODUCT_NAME = 'MyFinHub'");
    expect(main).toContain('title: PRODUCT_NAME');
  });

  it('keeps the renderer sandboxed and exposes only narrow recovery/update IPC', () => {
    expect(main).toContain('contextIsolation: true');
    expect(main).toContain('nodeIntegration: false');
    expect(main).toContain('sandbox: true');
    expect(main).toContain("preload: path.join(__dirname, 'preload.cjs')");
    expect(preload).toContain("contextBridge.exposeInMainWorld('myFinHubDesktop'");
    expect(preload).toContain('getRecoveryState: async () =>');
    expect(preload).toContain('retryStartup: async () =>');
    expect(preload).toContain('copyStartupDiagnostics: () =>');
    expect(preload).not.toContain('getSetupState:');
    expect(preload).not.toContain('saveSetup:');
    expect(preload).not.toContain("require('fs')");
    expect(preload).not.toContain('child_process');
    expect(main).toContain('isMainSender(event)');
    expect(main).toContain('isSetupSender(event)');
  });

  it('does not ask normal users for infrastructure configuration', () => {
    expect(desktopPackage.build.files).toContain('bootstrap.cjs');
    expect(desktopPackage.build.files).toContain('runtime-defaults.cjs');
    expect(bootstrap).toContain("require('./runtime-defaults.cjs')");
    expect(bootstrap).toContain('process.env.SUPABASE_URL');
    expect(bootstrap).toContain('process.env.SUPABASE_PUBLISHABLE_KEY');
    expect(bootstrap).toContain('delete process.env.CARD_VAULT_KEY');
    expect(defaults).toContain("productionOrigin: 'https://mgfinhub.vercel.app'");
    expect(defaults).not.toMatch(/CARD_VAULT_KEY\s*:/);
    expect(recovery).not.toContain('SUPABASE_URL');
    expect(recovery).not.toContain('SUPABASE_PUBLISHABLE_KEY');
    expect(recovery).not.toContain('CARD_VAULT_KEY');
    expect(recoveryRenderer).not.toContain('supabaseUrl');
    expect(recoveryRenderer).not.toContain('supabasePublishableKey');
    expect(recovery).toContain('Νέα προσπάθεια');
    expect(recovery).toContain('Αντιγραφή διαγνωστικών');
  });

  it('keeps the local backend loopback-only while preserving the legacy protocol contract', () => {
    expect(main).toContain("const LOOPBACK = '127.0.0.1'");
    expect(main).toContain("const READY_PREFIX = 'RHEOMIQ_DESKTOP_READY='");
    expect(main).toContain("env.RHEOMIQ_HOST = LOOPBACK");
    expect(main).toContain("env.RHEOMIQ_PORT = '0'");
    expect(main).toContain("env.RHEOMIQ_DESKTOP = '1'");
    expect(main).toContain('windowsHide: true');
  });

  it('captures safe startup diagnostics instead of discarding backend stderr', () => {
    expect(main).toContain("child.stderr.on('data', chunk =>");
    expect(main).toContain('appendDiagnostic(stderrDiagnostic');
    expect(main).not.toContain("child.stderr.on('data', () => {})");
    expect(main).toContain("startupError('BACKEND_START_TIMEOUT'");
    expect(main).toContain("startupError('BACKEND_SPAWN_FAILED'");
    expect(recoveryRenderer).toContain('renderDiagnostic');
    expect(recoveryRenderer).toContain('bridge.copyStartupDiagnostics()');
  });

  it('keeps CARD_VAULT_KEY server-side for Windows PAN/expiry operations', () => {
    expect(bootstrap).toContain('delete process.env.CARD_VAULT_KEY');
    expect(vaultHandler).toContain("if(process.env.RHEOMIQ_DESKTOP==='1')");
    expect(vaultHandler).toContain('proxyDesktopCardVault');
    expect(vaultProxy).toContain("authorization:`Bearer ${accessToken}`");
    expect(vaultProxy).toContain('/api/card-secrets');
    expect(vaultProxy).toContain('mgfinhub.vercel.app');
  });

  it('surfaces explicit in-app update controls only through the Electron bridge', () => {
    expect(settings).toContain('<DesktopUpdatePanel/>');
    expect(updatePanel).toContain('window.myFinHubDesktop');
    expect(updatePanel).toContain('Έλεγχος τώρα');
    expect(updatePanel).toContain('Λήψη ενημέρωσης');
    expect(updatePanel).toContain('Εγκατάσταση & επανεκκίνηση');
    expect(updatePanel).toContain('progressbar');
  });

  it('checks controlled MyFinHub releases and verifies exact SHA-256 metadata before installation', () => {
    expect(main).toContain("const UPDATE_TAG = /^myfinhub-v");
    expect(main).toContain('MyFinHub-Setup-${version}-x64.exe');
    expect(main).toContain("crypto.createHash('sha256')");
    expect(main).toContain('UPDATE_HOSTS');
    expect(main).toContain("match[2] !== pendingRelease.installerName");
    expect(main).toContain('MIN_INSTALLER_BYTES');
    expect(main).toContain('MAX_INSTALLER_BYTES');
    expect(main).not.toContain('autoUpdater');
    const automatic = mainBlock('function scheduleAutomaticUpdateChecks()', 'function isMainSender');
    expect(automatic).toContain('checkForUpdates(false)');
    expect(automatic).not.toContain('downloadUpdate()');
    expect(automatic).not.toContain('installDownloadedUpdate()');
    expect(main).toContain("buttons: ['Λήψη ενημέρωσης', 'Αργότερα']");
    expect(main).toContain("buttons: ['Εγκατάσταση & επανεκκίνηση', 'Αργότερα']");
  });

  it('publishes unsigned personal releases safely and keeps signing optional', () => {
    expect(workflow).toContain("tags: ['myfinhub-v*']");
    expect(workflow).toContain('MyFinHub-Setup-*-x64.exe');
    expect(workflow).toContain('MYFINHUB_SIGNING_ENABLED=false');
    expect(workflow).toContain('Configure both Windows signing secrets or neither.');
    expect(workflow).toContain('Unknown publisher / SmartScreen');
    expect(workflow).toContain('Get-FileHash -Algorithm SHA256');
    expect(workflow).not.toContain('Signed desktop releases require');
  });

  it('installs, launches, verifies identity and uninstalls the real NSIS package in Windows CI', () => {
    expect(workflow).toContain('Install, launch and uninstall NSIS package');
    expect(workflow).toContain("-ArgumentList '/S'");
    expect(workflow).toContain("'MyFinHub.lnk'");
    expect(workflow).toContain('CreateShortcut($desktopShortcut)');
    expect(workflow).toContain("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*");
    expect(workflow).toContain("DisplayName -like 'MyFinHub*'");
    expect(workflow).toContain('UninstallString');
    expect(workflow).toContain('Installed MyFinHub process is not running from the installed executable path.');
    expect(workflow).toContain("Where-Object { $_.Path -eq $exe }");
    expect(workflow).toContain('ExtractAssociatedIcon($exe)');
    expect(workflow).toContain("-Filter 'Uninstall*.exe'");
    expect(workflow).toContain('MyFinHub executable remains after silent uninstall.');
  });

  it('keeps the new light/dark MyFinHub artwork and generates the Windows 512 size at build time', () => {
    for (const asset of [
      'public/favicon.png',
      'public/brand/icon-light-32.png',
      'public/brand/icon-dark-32.png',
      'public/brand/icon-light-192.png',
      'public/brand/icon-dark-192.png',
      'public/brand/icon-512.svg',
      'desktop/setup-brand.png',
      'assets/branding/myfinhub/icon-light-32.png',
      'assets/branding/myfinhub/icon-dark-32.png',
      'assets/branding/myfinhub/icon-light-192.png',
      'assets/branding/myfinhub/icon-dark-192.png',
      'assets/branding/myfinhub/icon-512.svg',
      'assets/branding/myfinhub/README.md',
    ]) expect(exists(asset)).toBe(true);
    const favicon=bytes('public/favicon.png');
    expect([...favicon.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
    expect(favicon.readUInt32BE(16)).toBe(32);
    expect(favicon.readUInt32BE(20)).toBe(32);
    expect(bytes('desktop/setup-brand.png').equals(bytes('public/brand/icon-dark-192.png'))).toBe(true);
    expect(prepareBuild).toContain("const sourceIcon=path.join(root,'public','brand','icon-light-192.png')");
    expect(prepareBuild).toContain('[Drawing.Bitmap]::new(512,512)');
    expect(workflow).toContain('assets/branding/myfinhub/**');
  });

  it('keeps CVV out of the server-side desktop boundary', () => {
    expect(main).not.toMatch(/CVV|CVC|securityCode/i);
    expect(recoveryRenderer).not.toMatch(/CVV|CVC|securityCode/i);
  });
});