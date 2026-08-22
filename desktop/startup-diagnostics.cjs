'use strict';

const MAX_DIAGNOSTIC_CHARS = 6000;

class DesktopStartupError extends Error {
  constructor(code, stage, message, detail = '') {
    super(message);
    this.name = 'DesktopStartupError';
    this.code = code;
    this.stage = stage;
    this.detail = detail;
  }
}

function startupError(code, stage, message, detail = '') {
  return new DesktopStartupError(code, stage, message, detail);
}

function rawMessage(error) {
  if (error instanceof Error) return error.message || error.name;
  return typeof error === 'string' ? error : 'Unknown startup error.';
}

function classifyStartupError(error, fallbackCode = 'DESKTOP_STARTUP_FAILED', fallbackStage = 'startup') {
  if (error instanceof DesktopStartupError) return error;
  const message = rawMessage(error);
  const mappings = [
    [/Invalid Supabase URL|Supabase URL must be HTTPS|Invalid Supabase publishable key/i, 'DESKTOP_CONFIG_INVALID', 'configuration', 'Τα στοιχεία σύνδεσης Supabase δεν είναι έγκυρα.'],
    [/Invalid card-vault key|Invalid card-vault key version/i, 'CARD_VAULT_CONFIG_INVALID', 'secure-storage', 'Το card-vault key ή το key version δεν είναι έγκυρο.'],
    [/Windows secure storage is unavailable/i, 'SECURE_STORAGE_UNAVAILABLE', 'secure-storage', 'Η ασφαλής αποθήκευση των Windows δεν είναι διαθέσιμη.'],
    [/Desktop runtime is not configured/i, 'DESKTOP_CONFIG_MISSING', 'configuration', 'Η τοπική ρύθμιση του MyFinHub λείπει.'],
    [/Bundled Node\.js runtime is missing/i, 'DESKTOP_RUNTIME_MISSING', 'runtime', 'Λείπει το bundled Node.js runtime της εγκατάστασης.'],
    [/Desktop bundle is incomplete/i, 'DESKTOP_BUNDLE_INCOMPLETE', 'runtime', 'Η εγκατάσταση του MyFinHub είναι ελλιπής.'],
  ];
  for (const [pattern, code, stage, publicMessage] of mappings) {
    if (pattern.test(message)) return startupError(code, stage, publicMessage, message);
  }
  return startupError(fallbackCode, fallbackStage, 'Το MyFinHub δεν μπόρεσε να ολοκληρώσει την εκκίνηση.', message);
}

function redactDiagnosticText(value, secrets = []) {
  let text = String(value ?? '').replace(/\0/g, '').replace(/\r/g, '').trim();
  for (const secret of secrets) {
    const token = String(secret || '').trim();
    if (token.length >= 6) text = text.split(token).join('[redacted]');
  }
  text = text
    .replace(/Bearer\s+[^\s'"`]+/gi, 'Bearer [redacted]')
    .replace(/\bsb_(?:publishable|secret)_[A-Za-z0-9._-]+\b/g, '[redacted-supabase-key]')
    .replace(/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/g, '[redacted-jwt]')
    .replace(/\b[0-9a-f]{64}\b/gi, '[redacted-64hex]');
  if (text.length > MAX_DIAGNOSTIC_CHARS) text = text.slice(-MAX_DIAGNOSTIC_CHARS);
  return text;
}

function appendDiagnostic(current, chunk, secrets = []) {
  const next = [String(current || ''), redactDiagnosticText(chunk, secrets)].filter(Boolean).join('\n').trim();
  return next.length > MAX_DIAGNOSTIC_CHARS ? next.slice(-MAX_DIAGNOSTIC_CHARS) : next;
}

function publicDiagnostic(error, extraDetail = '', secrets = []) {
  const classified = classifyStartupError(error);
  const detail = redactDiagnosticText([classified.detail, extraDetail].filter(Boolean).join('\n'), secrets);
  return {
    code: classified.code,
    stage: classified.stage,
    message: classified.message,
    detail: detail || 'Δεν δόθηκε επιπλέον ασφαλές diagnostic detail.',
  };
}

function formatDiagnostic(diagnostic, version = '') {
  const value = diagnostic || {};
  return [
    `MyFinHub${version ? ` ${version}` : ''} desktop diagnostic`,
    `Code: ${String(value.code || 'DESKTOP_STARTUP_FAILED')}`,
    `Stage: ${String(value.stage || 'startup')}`,
    `Message: ${String(value.message || 'Startup failed.')}`,
    `Detail: ${String(value.detail || 'No additional detail.')}`,
  ].join('\n');
}

async function preflightSupabase(config, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw startupError('SUPABASE_PREFLIGHT_UNAVAILABLE', 'supabase-preflight', 'Ο έλεγχος σύνδεσης Supabase δεν είναι διαθέσιμος.', 'No fetch implementation is available.');
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(100, options.timeoutMs) : 8000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${config.supabaseUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: config.supabasePublishableKey,
        accept: 'application/json',
        'user-agent': options.userAgent || 'MyFinHub/Desktop',
      },
      redirect: 'error',
      signal: controller.signal,
    });
    if (response.status === 401 || response.status === 403) {
      throw startupError('SUPABASE_PREFLIGHT_REJECTED', 'supabase-preflight', 'Το Supabase project απέρριψε το publishable key.', `HTTP ${response.status}`);
    }
    if (response.status === 404) {
      throw startupError('SUPABASE_PREFLIGHT_NOT_FOUND', 'supabase-preflight', 'Το Supabase URL δεν αντιστοιχεί σε διαθέσιμο Auth endpoint.', 'HTTP 404');
    }
    if (!response.ok) {
      throw startupError('SUPABASE_PREFLIGHT_FAILED', 'supabase-preflight', 'Το Supabase project δεν ολοκλήρωσε τον έλεγχο σύνδεσης.', `HTTP ${response.status}`);
    }
    return true;
  } catch (error) {
    if (error instanceof DesktopStartupError) throw error;
    if (error && error.name === 'AbortError') {
      throw startupError('SUPABASE_PREFLIGHT_TIMEOUT', 'supabase-preflight', 'Ο έλεγχος σύνδεσης Supabase έληξε λόγω timeout.', `Timeout after ${timeoutMs}ms`);
    }
    throw startupError('SUPABASE_PREFLIGHT_NETWORK', 'supabase-preflight', 'Δεν ήταν δυνατή η σύνδεση με το Supabase project.', rawMessage(error));
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  DesktopStartupError,
  MAX_DIAGNOSTIC_CHARS,
  appendDiagnostic,
  classifyStartupError,
  formatDiagnostic,
  preflightSupabase,
  publicDiagnostic,
  redactDiagnosticText,
  startupError,
};
