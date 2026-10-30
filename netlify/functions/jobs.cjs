'use strict';
const providers = {
 greenhouse: slug => 'https://boards-api.greenhouse.io/v1/boards/'+slug+'/jobs?content=true',
 lever: slug => 'https://api.lever.co/v0/postings/'+slug+'?mode=json',
 'lever-eu': slug => 'https://api.eu.lever.co/v0/postings/'+slug+'?mode=json',
 ashby: slug => 'https://api.ashbyhq.com/posting-api/job-board/'+slug
};
class SourceError extends Error { constructor(code,message){super(message);this.code=code;} }
function text(value) {
 let s=typeof value==='string'?value:'';
 for(let i=0;i<2;i++)s=s.replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&amp;/gi,'&').replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(_,n)=>{const c=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return c>0&&c<=0x10ffff?String.fromCodePoint(c):'';});
 return s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim();
}
function normalize(provider, board, data, now) {
 const rows=provider.startsWith('lever')?data:data?.jobs;
 if(!Array.isArray(rows))throw new SourceError('INVALID_RESPONSE','A fonte retornou um formato inesperado.');
 const seen=new Set();
 return rows.map(j=>{
  if(!j||typeof j!=='object'||j.isListed===false)return null;
  let parsed;try{parsed=new URL(j.absolute_url||j.hostedUrl||j.jobUrl);}catch{return null;}
  if(parsed.protocol!=='https:'||parsed.username||parsed.password)return null;
  parsed.hash='';['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(k=>parsed.searchParams.delete(k));parsed.searchParams.sort();
  const role=text(j.title||j.text).slice(0,200),location=text(j.location?.name||j.categories?.location||j.location).slice(0,300);
  const full=text(j.content||j.descriptionPlain||j.descriptionText||j.descriptionHtml||'')+' '+(Array.isArray(j.lists)?j.lists:[]).map(x=>text(x?.text)+' '+text(x?.content)).join(' ');
  if(!role)return null;
  const workplace=String(j.workplaceType||'').toLowerCase();
  const mode=workplace==='hybrid'?'Híbrido':workplace==='remote'||j.isRemote===true?'Remoto':['on-site','onsite'].includes(workplace)?'Presencial':'Não informado';
  const posted=j.publishedAt??j.createdAt,description=full.trim().slice(0,6000);
  return {sourceId:provider+':'+board+':'+String(j.id||parsed.href),source:provider,board,role,company:board,location,description,descriptionTruncated:full.trim().length>6000,descriptionUnavailable:!description,url:parsed.href,mode,publishedAt:posted!=null&&!isNaN(new Date(posted).getTime())?new Date(posted).toISOString():null,checkedAt:now,eligibility:'Verifique localização e autorização de trabalho no anúncio'};
 }).filter(j=>{if(!j||seen.has(j.url))return false;seen.add(j.url);return true;});
}
async function readJson(response,limit=16000000){
 if(Number(response.headers.get('content-length'))>limit){await response.body?.cancel();throw new SourceError('BODY_TOO_LARGE','A fonte excedeu o limite de leitura.');}
 const reader=response.body?.getReader();if(!reader)throw new SourceError('INVALID_RESPONSE','A fonte retornou uma resposta vazia.');
 const chunks=[];let bytes=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>limit)throw new SourceError('BODY_TOO_LARGE','A fonte excedeu o limite de leitura.');chunks.push(value);}}
 catch(error){await reader.cancel().catch(()=>{});throw error;}
 let raw=new Uint8Array(bytes),offset=0;for(const c of chunks){raw.set(c,offset);offset+=c.byteLength;}
 try{return JSON.parse(new TextDecoder().decode(raw));}catch{throw new SourceError('INVALID_RESPONSE','A fonte não retornou JSON válido.');}
}
function createHandler(fetcher=fetch){
 return async event=>{
 const reply=(statusCode,body,cache='no-store')=>({statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':cache,'X-Content-Type-Options':'nosniff',...(statusCode===405?{Allow:'GET'}:{})},body:JSON.stringify(body)});
 if(event.httpMethod!=='GET')return reply(405,{error:'Método não permitido'});
 const {provider,board}=event.queryStringParameters||{};
 if(typeof provider!=='string'||!Object.hasOwn(providers,provider)||typeof board!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(board))return reply(400,{error:'Informe fonte e identificador válidos'});
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 const request=async url=>{
  const r=await fetcher(url,{signal:controller.signal,redirect:'error',headers:{Accept:'application/json'}});
  if(!r.ok){await r.body?.cancel();throw new SourceError('UPSTREAM_'+r.status,r.status===404?'Página de carreiras não encontrada. Confira o identificador.':r.status===429?'A fonte limitou as consultas. Aguarde antes de tentar novamente.':'A fonte respondeu com erro HTTP '+r.status+'.');}
  return readJson(r);
 };
 try{
  let data,warnings=[];
  try{data=await request(providers[provider](board));}
  catch(error){
   if(provider!=='greenhouse'||error.code!=='BODY_TOO_LARGE')throw error;
   data=await request(providers.greenhouse(board).replace('content=true','content=false'));
   warnings.push('A fonte tem descrições muito grandes. Foram carregados os títulos e links; consulte a descrição no anúncio original.');
  }
  const checkedAt=new Date().toISOString(),all=normalize(provider,board,data,checkedAt);
  // Keep the serverless response below its payload limit; never treat a partial snapshot as closure evidence.
  const jobs=[];let bytes=300;
  for(const job of all){const size=Buffer.byteLength(JSON.stringify(job))+1;if(bytes+size>4500000)break;jobs.push(job);bytes+=size;}
  const complete=jobs.length===all.length;
  if(!complete)warnings.push('Resultado parcial por limite de tamanho. Vagas ausentes não serão marcadas como encerradas.');
  return reply(200,{jobs,checkedAt,source:provider,board,complete,total:all.length,warnings},'public, max-age=300, s-maxage=900');
 }catch(error){
  const timedOut=controller.signal.aborted||['AbortError','TimeoutError'].includes(error.name);
  return reply(502,{code:timedOut?'TIMEOUT':error.code||'NETWORK_ERROR',error:timedOut?'A fonte demorou demais. Tente novamente mais tarde.':error instanceof SourceError?error.message:'Falha de conexão com a fonte. Os resultados anteriores foram preservados.'});
 }finally{clearTimeout(timer);}
 };
}
exports.normalize=normalize;exports.readJson=readJson;exports.createHandler=createHandler;exports.handler=createHandler();
