'use strict';

const fs = require('node:fs');
const path = require('node:path');
const defaults = require('./runtime-defaults.cjs');

function requirePublicValue(name, value, placeholder) {
  const normalized = String(value || '').trim();
  if (!normalized || normalized === placeholder) {
    throw new Error(`${name} is missing from the controlled desktop release configuration.`);
  }
  return normalized;
}

function secureDelete(file) {
  try {
    const size = fs.statSync(file).size;
    if (size > 0 && size <= 1024 * 1024) fs.writeFileSync(file, Buffer.alloc(size));
  } catch { /* best effort */ }
  try { fs.unlinkSync(file); } catch { /* already absent / best effort */ }
}

// Developer/CI environments may override the public client config explicitly. Packaged releases
// normally use the controlled values in runtime-defaults.cjs so end users never provision them.
process.env.SUPABASE_URL = String(process.env.SUPABASE_URL || requirePublicValue(
  'SUPABASE_URL', defaults.supabaseUrl, '__MYFINHUB_SUPABASE_URL__',
)).trim();
process.env.SUPABASE_PUBLISHABLE_KEY = String(process.env.SUPABASE_PUBLISHABLE_KEY || requirePublicValue(
  'SUPABASE_PUBLISHABLE_KEY', defaults.supabasePublishableKey, '__MYFINHUB_SUPABASE_PUBLISHABLE_KEY__',
)).trim();
process.env.MYFINHUB_PRODUCTION_ORIGIN = String(defaults.productionOrigin || '').trim();

// A desktop binary must never receive the server-side card-vault encryption key through release
// configuration. Card-secret operations are proxied to the canonical production API instead.
delete process.env.CARD_VAULT_KEY;
delete process.env.CARD_VAULT_KEY_VERSION;
delete process.env.SUPABASE_SECRET_KEY;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

// v1.2.0 and older could create local provisioning files, including a DPAPI-wrapped vault key or a
// short-lived pending file. Once the controlled public config above is available they are obsolete.
// Remove them before the legacy host can try to load them, so an old DPAPI payload can never block
// startup and a stale pending plaintext value cannot survive an upgrade.
const appData = String(process.env.APPDATA || '').trim();
if (appData) {
  for (const directory of ['MyFinHub', 'RheomIQ', 'rheomiq-desktop']) {
    for (const name of ['runtime-config.json', 'runtime-secrets.json', 'pending-provision.json']) {
      secureDelete(path.join(appData, directory, name));
    }
  }
}

require('./main.cjs');
