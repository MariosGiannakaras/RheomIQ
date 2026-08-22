import { accessTokenAal, assertMutationSessionOrigin, clearSessionCookiesIfCookie, requireSession } from './auth.js';
import { ApiError, handleApi, methodNotAllowed, readJsonBody, sendJson } from './http.js';
import { isOwner } from './storage.js';
import { deleteCardSecrets, readCardSecrets, writeCardSecrets } from './cardVaultStore.js';
import { proxyDesktopCardVault } from './desktopCardVaultProxy.js';

export const MAX_CARD_VAULT_BODY_BYTES=4*1024;
const RATE_WINDOW_MS=60_000;
const RATE_LIMIT=60;
const rateByOwner=new Map<string,{startedAt:number;count:number}>();

function assertRate(ownerUserId:string){
  const now=Date.now();const current=rateByOwner.get(ownerUserId);
  if(!current||now-current.startedAt>=RATE_WINDOW_MS){rateByOwner.set(ownerUserId,{startedAt:now,count:1});return}
  current.count+=1;
  if(current.count>RATE_LIMIT)throw new ApiError(429,'CARD_VAULT_RATE_LIMITED','Πάρα πολλές ενέργειες ασφαλών στοιχείων. Δοκίμασε ξανά σε λίγο.');
}

function object(value:unknown):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new ApiError(400,'INVALID_CARD_SECRET_REQUEST','Μη έγκυρο αίτημα στοιχείων κάρτας.');
  return value as Record<string,unknown>;
}

export function parseCardVaultRequest(value:unknown,method:'POST'|'PUT'|'DELETE'){
  const body=object(value);
  for(const key of Object.keys(body)){
    const normalized=key.replace(/[^a-z0-9]/gi,'').toLowerCase();
    if(['cvv','cvc','securitycode','cardverificationvalue','cardverificationcode'].includes(normalized))throw new ApiError(400,'CVV_PERSISTENCE_DISABLED','Το CVV δεν αποθηκεύεται στον server.');
  }
  const allowed=method==='PUT'?new Set(['cardId','pan','expiry']):new Set(['cardId']);
  if(Object.keys(body).some(key=>!allowed.has(key)))throw new ApiError(400,'INVALID_CARD_SECRET_REQUEST','Μη έγκυρο αίτημα στοιχείων κάρτας.');
  const cardId=typeof body.cardId==='string'?body.cardId.trim():'';
  if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(cardId))throw new ApiError(400,'INVALID_CARD_ID','Μη έγκυρη αναφορά κάρτας.');
  if(method!=='PUT')return {cardId};
  const pan=body.pan===undefined?undefined:typeof body.pan==='string'?body.pan: (()=>{throw new ApiError(400,'INVALID_CARD_PAN','Ο αριθμός κάρτας δεν είναι έγκυρος.');})();
  const expiry=body.expiry===undefined?undefined:typeof body.expiry==='string'?body.expiry: (()=>{throw new ApiError(400,'INVALID_CARD_EXPIRY','Η ημερομηνία λήξης δεν είναι έγκυρη.');})();
  return {cardId,pan,expiry};
}

export async function handleCardVaultRequest(req:any,res:any){
  await handleApi(res,async()=>{
    const method=String(req.method||'').toUpperCase();
    if(method!=='POST'&&method!=='PUT'&&method!=='DELETE')return methodNotAllowed(res,['POST','PUT','DELETE']);
    const session=await requireSession(req,res,{allowBearer:true});
    assertMutationSessionOrigin(req,session);
    if(!(await isOwner(session.accessToken))){clearSessionCookiesIfCookie(req,res,session);throw new ApiError(401,'AUTH_REQUIRED','Authentication required.');}
    if(accessTokenAal(session.accessToken)!=='aal2')throw new ApiError(403,'MFA_REQUIRED','Verification required.');
    const ownerUserId=String(session.user?.id||'');
    if(!ownerUserId)throw new ApiError(401,'AUTH_REQUIRED','Authentication required.');
    assertRate(ownerUserId);
    const body=parseCardVaultRequest(await readJsonBody(req,MAX_CARD_VAULT_BODY_BYTES),method as 'POST'|'PUT'|'DELETE');

    // Windows never receives CARD_VAULT_KEY. Its loopback backend reuses the already-authenticated
    // owner AAL2 access token against the canonical production API, where vault encryption remains
    // server-side. Production/web/native bearer requests continue using the local store directly.
    if(process.env.RHEOMIQ_DESKTOP==='1'){
      const payload=await proxyDesktopCardVault(method as 'POST'|'PUT'|'DELETE',body,session.accessToken);
      return sendJson(res,200,payload);
    }

    if(method==='POST'){
      const secret=await readCardSecrets(ownerUserId,body.cardId,session.accessToken);
      if(!secret)throw new ApiError(404,'CARD_SECRET_NOT_FOUND','Δεν υπάρχουν αποθηκευμένα στοιχεία για αυτή την κάρτα.');
      return sendJson(res,200,{pan:secret.pan??null,expiry:secret.expiry??null});
    }
    if(method==='PUT'){
      const input=body as {cardId:string;pan?:string;expiry?:string};
      const secret=await writeCardSecrets(ownerUserId,input.cardId,{pan:input.pan,expiry:input.expiry},session.accessToken);
      return sendJson(res,200,{saved:true,last4:secret.pan?.slice(-4)??null});
    }
    await deleteCardSecrets(ownerUserId,body.cardId,session.accessToken);
    return sendJson(res,200,{deleted:true});
  });
}
