import { ApiError } from './http.js';

const TIMEOUT_MS=12_000;
const CANONICAL_PRODUCTION_ORIGIN='https://mgfinhub.vercel.app';

type RemotePayload={error?:string;code?:string;requestId?:string;pan?:string|null;expiry?:string|null;saved?:boolean;last4?:string|null;deleted?:boolean};

function productionOrigin(){
  const raw=String(process.env.MYFINHUB_PRODUCTION_ORIGIN||'').trim().replace(/\/$/,'');
  let parsed:URL;
  try{parsed=new URL(raw)}catch{throw new ApiError(500,'DESKTOP_VAULT_PROXY_CONFIG_ERROR','Desktop card vault proxy is not configured.',false)}
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.origin!==CANONICAL_PRODUCTION_ORIGIN){
    throw new ApiError(500,'DESKTOP_VAULT_PROXY_CONFIG_ERROR','Desktop card vault proxy is not configured.',false);
  }
  return parsed.origin;
}

export async function proxyDesktopCardVault(method:'POST'|'PUT'|'DELETE',body:unknown,accessToken:string){
  // Validate configuration outside the network catch so a bad/malicious origin cannot be disguised
  // as an ordinary transient upstream outage.
  const origin=productionOrigin();
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  let response:Response;
  try{
    response=await fetch(`${origin}/api/card-secrets`,{
      method,
      headers:{
        authorization:`Bearer ${accessToken}`,
        accept:'application/json',
        'content-type':'application/json',
        'user-agent':'MyFinHub-Windows-Desktop',
      },
      body:JSON.stringify(body),
      redirect:'error',
      signal:controller.signal,
    });
  }catch(error){
    if(controller.signal.aborted)throw new ApiError(504,'CARD_VAULT_TIMEOUT','Το ασφαλές vault καρτών άργησε να απαντήσει. Δοκίμασε ξανά.');
    throw new ApiError(503,'CARD_VAULT_UNAVAILABLE','Το ασφαλές vault καρτών δεν είναι διαθέσιμο. Δοκίμασε ξανά.',false);
  }finally{clearTimeout(timer)}
  const payload=await response.json().catch(()=>null) as RemotePayload|null;
  if(response.ok)return payload||{};
  const code=typeof payload?.code==='string'?payload.code:'';
  const message=typeof payload?.error==='string'?payload.error:'';
  if(response.status===401)throw new ApiError(401,'AUTH_REQUIRED','Authentication required.');
  if(response.status===403)throw new ApiError(403,code==='MFA_REQUIRED'?'MFA_REQUIRED':'FORBIDDEN',code==='MFA_REQUIRED'?'Verification required.':'Access denied.');
  if(response.status===404&&code==='CARD_SECRET_NOT_FOUND')throw new ApiError(404,'CARD_SECRET_NOT_FOUND','Δεν υπάρχουν αποθηκευμένα στοιχεία για αυτή την κάρτα.');
  if(response.status===429)throw new ApiError(429,'CARD_VAULT_RATE_LIMITED','Πάρα πολλές ενέργειες ασφαλών στοιχείων. Δοκίμασε ξανά σε λίγο.');
  if(response.status>=400&&response.status<500&&code&&message)throw new ApiError(response.status,code,message);
  throw new ApiError(503,'CARD_VAULT_UNAVAILABLE','Το ασφαλές vault καρτών δεν είναι διαθέσιμο. Δοκίμασε ξανά.',false);
}
