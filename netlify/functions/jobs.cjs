'use strict';
const providers = {
 greenhouse: slug => 'https://boards-api.greenhouse.io/v1/boards/'+slug+'/jobs?content=true',
 lever: slug => 'https://api.lever.co/v0/postings/'+slug+'?mode=json',
 'lever-eu': slug => 'https://api.eu.lever.co/v0/postings/'+slug+'?mode=json',
 ashby: slug => 'https://api.ashbyhq.com/posting-api/job-board/'+slug
};
function text(value) { return String(value||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,20000); }
function normalize(provider, board, data, now) {
 const rows=provider.startsWith('lever')?data:data.jobs;
 if(!Array.isArray(rows))throw Error('Resposta da fonte inválida');
 const seen=new Set();
 return rows.filter(j=>j.isListed!==false).map(j=>{
  const url=j.absolute_url||j.hostedUrl||j.jobUrl;
  let parsed;try{parsed=new URL(url);}catch{return null;}
  if(parsed.protocol!=='https:')return null;
  parsed.hash='';['utm_source','utm_medium','utm_campaign'].forEach(k=>parsed.searchParams.delete(k));
  const role=text(j.title||j.text),location=text(j.location?.name||j.categories?.location||j.location);
  const description=text(j.content||j.descriptionPlain||j.descriptionText||j.descriptionHtml||'')+' '+(j.lists||[]).map(x=>text(x.text)+' '+text(x.content)).join(' ');
  if(!role)return null;
  const mode=j.workplaceType==='remote'||j.isRemote===true?'Remoto':j.workplaceType==='hybrid'?'Híbrido':j.workplaceType==='on-site'||j.isRemote===false?'Presencial':'Não informado';
  const posted=j.publishedAt||j.createdAt;
  return {sourceId:provider+':'+board+':'+String(j.id||parsed.href),source:provider,board,role,company:board,location,description:description.trim(),url:parsed.href,mode,publishedAt:posted&&!isNaN(new Date(posted).getTime())?new Date(posted).toISOString():null,checkedAt:now,eligibility:'Verifique localização e autorização de trabalho no anúncio'};
 }).filter(j=>{if(!j||seen.has(j.url))return false;seen.add(j.url);return true;});
}
exports.normalize=normalize;
exports.handler=async event=>{
 const reply=(statusCode,body,cache='no-store')=>({statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':cache,'X-Content-Type-Options':'nosniff'},body:JSON.stringify(body)});
 if(event.httpMethod!=='GET')return reply(405,{error:'Método não permitido'});
 const {provider,board}=event.queryStringParameters||{};
 if(!Object.hasOwn(providers,provider||'')||!/^[a-zA-Z0-9_-]{1,80}$/.test(board||''))return reply(400,{error:'Informe fonte e identificador válidos'});
 try{
  const response=await fetch(providers[provider](board),{signal:AbortSignal.timeout(12000),redirect:'error',headers:{Accept:'application/json'}});
  if(!response.ok)return reply(502,{error:'Fonte indisponível (HTTP '+response.status+'). Confira o identificador.'});
  const raw=await response.text();if(raw.length>5000000)throw Error('Resposta excede o limite');
  const checkedAt=new Date().toISOString(),jobs=normalize(provider,board,JSON.parse(raw),checkedAt);
  return reply(200,{jobs,checkedAt,source:provider,board},'public, max-age=300, s-maxage=900');
 }catch{return reply(502,{error:'Não foi possível consultar a fonte. Tente novamente mais tarde.'});}
};
