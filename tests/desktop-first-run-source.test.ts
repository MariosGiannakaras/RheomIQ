import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relative:string) => fs.readFileSync(path.join(root, relative), 'utf8');
const bootstrap = read('desktop/bootstrap.cjs');
const defaults = read('desktop/runtime-defaults.cjs');
const main = read('desktop/main.cjs');
const preload = read('desktop/preload.cjs');
const recovery = read('desktop/setup.html');
const renderer = read('desktop/setup-renderer.js');
const cleanLaunchWorkflow = read('.github/workflows/desktop-clean-launch.yml');

describe('Windows no-setup startup/recovery contract', () => {
  it('boots from application-owned public config instead of user provisioning', () => {
    expect(bootstrap).toContain("require('./runtime-defaults.cjs')");
    expect(bootstrap).toContain('process.env.SUPABASE_URL');
    expect(bootstrap).toContain('process.env.SUPABASE_PUBLISHABLE_KEY');
    expect(defaults).toContain('__MYFINHUB_SUPABASE_URL__');
    expect(defaults).toContain('__MYFINHUB_SUPABASE_PUBLISHABLE_KEY__');
    expect(recovery).not.toContain('SUPABASE_URL');
    expect(recovery).not.toContain('SUPABASE_PUBLISHABLE_KEY');
    expect(recovery).not.toContain('CARD_VAULT_KEY');
  });

  it('captures backend diagnostics instead of discarding stderr', () => {
    expect(main).toContain("child.stderr.on('data', chunk =>");
    expect(main).toContain('appendDiagnostic(stderrDiagnostic');
    expect(main).not.toContain("child.stderr.on('data', () => {})");
    expect(main).toContain("startupError('BACKEND_EXITED_DURING_START'");
    expect(main).toContain("startupError('BACKEND_START_TIMEOUT'");
    expect(main).toContain("startupError('BACKEND_SPAWN_FAILED'");
  });

  it('shows recovery and retry without exposing infrastructure values to the renderer', () => {
    expect(main).toContain('function sendSetupProgress');
    expect(main).toContain("setupWindow.webContents.send('myfinhub:setup-progress'");
    expect(main).toContain('return { ok: false, error: diagnostic }');
    expect(renderer).toContain('renderDiagnostic');
    expect(renderer).toContain("document.getElementById('retry')");
    expect(renderer).toContain('bridge.retryStartup()');
    expect(renderer).not.toContain('supabaseUrl');
    expect(renderer).not.toContain('supabasePublishableKey');
    expect(preload).toContain('getRecoveryState: async () =>');
    expect(preload).toContain('retryStartup: async () =>');
    expect(recovery).toContain('Νέα προσπάθεια');
    expect(recovery).toContain('Δεν χρειάζεται να συμπληρώσεις τεχνικές ρυθμίσεις');
  });

  it('supports safe diagnostic copy without exposing Electron primitives to the renderer', () => {
    expect(main).toContain("ipcMain.handle('myfinhub:copy-setup-diagnostics'");
    expect(main).toContain('formatDiagnostic(lastSetupDiagnostic');
    expect(preload).toContain('copyStartupDiagnostics: () => ipcRenderer.invoke');
    expect(renderer).toContain('bridge.copyStartupDiagnostics()');
    expect(recovery).toContain('Αντιγραφή διαγνωστικών');
    expect(renderer).not.toContain("require('electron')");
  });

  it('requires a clean installed-user launch gate before this fix can merge', () => {
    expect(cleanLaunchWorkflow).toContain('Clean installed-user launch without runtime provisioning');
    expect(cleanLaunchWorkflow).toContain('runtime-defaults.cjs');
    expect(cleanLaunchWorkflow).toContain('Remove-Item Env:SUPABASE_URL');
    expect(cleanLaunchWorkflow).toContain('Clean launch unexpectedly created runtime-config.json.');
    expect(cleanLaunchWorkflow).toContain('Clean launch unexpectedly created runtime-secrets.json.');
  });
});
