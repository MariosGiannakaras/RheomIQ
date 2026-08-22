import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const diagnostics = require('../desktop/startup-diagnostics.cjs') as {
  MAX_DIAGNOSTIC_CHARS:number;
  appendDiagnostic:(current:string,chunk:string,secrets?:string[])=>string;
  classifyStartupError:(error:unknown)=>{code:string;stage:string;message:string;detail:string};
  formatDiagnostic:(diagnostic:Record<string,string>,version?:string)=>string;
  preflightSupabase:(config:{supabaseUrl:string;supabasePublishableKey:string},options?:Record<string,unknown>)=>Promise<boolean>;
  publicDiagnostic:(error:unknown,detail?:string,secrets?:string[])=>{code:string;stage:string;message:string;detail:string};
  redactDiagnosticText:(value:unknown,secrets?:string[])=>string;
};

describe('desktop startup diagnostics', () => {
  it('redacts known credentials, bearer tokens, JWTs and vault-shaped keys', () => {
    const publishable = 'sb_publishable_example_123456789';
    const vault = 'a'.repeat(64);
    const jwt = `eyJ${'a'.repeat(30)}.${'b'.repeat(30)}.${'c'.repeat(20)}`;
    const input = `key=${publishable}\nAuthorization: Bearer token-123456789\njwt=${jwt}\nvault=${vault}`;
    const output = diagnostics.redactDiagnosticText(input, [publishable, vault]);
    expect(output).not.toContain(publishable);
    expect(output).not.toContain(vault);
    expect(output).not.toContain('token-123456789');
    expect(output).not.toContain(jwt);
    expect(output).toContain('[redacted]');
    expect(output).toContain('Bearer [redacted]');
  });

  it('bounds captured backend diagnostics', () => {
    const output = diagnostics.appendDiagnostic('prefix', 'x'.repeat(diagnostics.MAX_DIAGNOSTIC_CHARS * 2));
    expect(output.length).toBeLessThanOrEqual(diagnostics.MAX_DIAGNOSTIC_CHARS);
  });

  it('classifies known runtime/config failures into stable public codes', () => {
    expect(diagnostics.classifyStartupError(new Error('Bundled Node.js runtime is missing.')).code).toBe('DESKTOP_RUNTIME_MISSING');
    expect(diagnostics.classifyStartupError(new Error('Invalid Supabase publishable key.')).code).toBe('DESKTOP_CONFIG_INVALID');
    expect(diagnostics.classifyStartupError(new Error('Windows secure storage is unavailable.')).stage).toBe('secure-storage');
  });

  it('keeps raw backend details behind redaction in public diagnostics', () => {
    const secret = 'sb_publishable_private_test_value_123';
    const diagnostic = diagnostics.publicDiagnostic(new Error('backend failed'), `fatal: apikey=${secret}`, [secret]);
    expect(diagnostic.code).toBe('DESKTOP_STARTUP_FAILED');
    expect(diagnostic.detail).not.toContain(secret);
    expect(diagnostic.detail).toContain('[redacted]');
  });

  it('preflights Supabase settings and accepts a successful project/key pair', async () => {
    const fetchImpl = vi.fn(async (_url:string, _init:RequestInit) => ({ ok: true, status: 200 }));
    await expect(diagnostics.preflightSupabase(
      { supabaseUrl: 'https://example.supabase.co', supabasePublishableKey: 'sb_publishable_test' },
      { fetchImpl, timeoutMs: 500 },
    )).resolves.toBe(true);
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe('https://example.supabase.co/auth/v1/settings');
    expect((init.headers as Record<string,string>).apikey).toBe('sb_publishable_test');
  });

  it('returns a stable rejected-key code without exposing the key', async () => {
    const fetchImpl = vi.fn(async (_url:string, _init:RequestInit) => ({ ok: false, status: 401 }));
    const config = { supabaseUrl: 'https://example.supabase.co', supabasePublishableKey: 'sb_publishable_bad_secret' };
    await expect(diagnostics.preflightSupabase(config, { fetchImpl, timeoutMs: 500 })).rejects.toMatchObject({
      code: 'SUPABASE_PREFLIGHT_REJECTED',
      stage: 'supabase-preflight',
    });
  });

  it('formats only the already-sanitized diagnostic payload for clipboard use', () => {
    const text = diagnostics.formatDiagnostic({ code: 'BACKEND_SPAWN_FAILED', stage: 'backend-start', message: 'Αποτυχία.', detail: 'spawn ENOENT' }, '1.2.1');
    expect(text).toContain('MyFinHub 1.2.1 desktop diagnostic');
    expect(text).toContain('Code: BACKEND_SPAWN_FAILED');
    expect(text).toContain('Stage: backend-start');
  });
});
