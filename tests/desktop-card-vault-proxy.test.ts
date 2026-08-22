import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxyDesktopCardVault } from '../server/desktopCardVaultProxy.js';

const originalOrigin=process.env.MYFINHUB_PRODUCTION_ORIGIN;

afterEach(()=>{
  vi.unstubAllGlobals();
  if(originalOrigin===undefined)delete process.env.MYFINHUB_PRODUCTION_ORIGIN;
  else process.env.MYFINHUB_PRODUCTION_ORIGIN=originalOrigin;
});

describe('desktop card vault proxy',()=>{
  it('forwards only the authenticated bearer request to the canonical production endpoint',async()=>{
    process.env.MYFINHUB_PRODUCTION_ORIGIN='https://mgfinhub.vercel.app';
    const fetchMock=vi.fn(async(_url:string,_init:RequestInit)=>new Response(JSON.stringify({pan:'4111111111111111',expiry:'12/30'}),{status:200,headers:{'content-type':'application/json'}}));
    vi.stubGlobal('fetch',fetchMock);
    const payload=await proxyDesktopCardVault('POST',{cardId:'card-1'},'owner-aal2-token');
    expect(payload).toMatchObject({pan:'4111111111111111',expiry:'12/30'});
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url,init]=fetchMock.mock.calls[0]!;
    expect(url).toBe('https://mgfinhub.vercel.app/api/card-secrets');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string,string>).authorization).toBe('Bearer owner-aal2-token');
    expect(JSON.parse(String(init.body))).toEqual({cardId:'card-1'});
  });

  it('rejects an arbitrary non-Vercel proxy origin',async()=>{
    process.env.MYFINHUB_PRODUCTION_ORIGIN='https://evil.example';
    vi.stubGlobal('fetch',vi.fn());
    await expect(proxyDesktopCardVault('POST',{cardId:'card-1'},'token')).rejects.toMatchObject({
      code:'DESKTOP_VAULT_PROXY_CONFIG_ERROR',
      status:500,
    });
  });

  it('maps production MFA rejection without exposing upstream internals',async()=>{
    process.env.MYFINHUB_PRODUCTION_ORIGIN='https://mgfinhub.vercel.app';
    vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({error:'Verification required.',code:'MFA_REQUIRED'}),{status:403,headers:{'content-type':'application/json'}})));
    await expect(proxyDesktopCardVault('PUT',{cardId:'card-1',pan:'4111111111111111'},'aal1-token')).rejects.toMatchObject({
      code:'MFA_REQUIRED',status:403,
    });
  });
});
