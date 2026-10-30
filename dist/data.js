(function(root){
 const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const statuses=['Salva','Preparada','Enviada','Entrevista','Encerrada'];
 function url(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
 function canonical(value){try{const u=new URL(url(value));u.hash='';['utm_source','utm_medium','utm_campaign','utm_content','utm_term','trk','trackingId','refId'].forEach(k=>u.searchParams.delete(k));u.searchParams.sort();return u.href.replace(/\/$/,'');}catch{return '';}}
 function sourceValid(s){return object(s)&&['greenhouse','lever','lever-eu','ashby'].includes(s.provider)&&typeof s.board==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(s.board);}
 function discoveryJob(j){return object(j)&&['sourceId','source','board','role','company','description','location','mode','url'].every(k=>typeof j[k]==='string')&&!!url(j.url);}
 function restore(raw,defaults){
  if(!object(raw)||!Array.isArray(raw.jobs)||!object(raw.profile)||!object(raw.rules))throw Error('Backup incompleto');
  const ids=new Set();
  for(const j of raw.jobs){
   if(!object(j)||['id','role','company','url','mode'].some(k=>typeof j[k]!=='string'||!j[k])||!url(j.url)||!statuses.includes(j.status)||ids.has(j.id)||['description','notes','draft','location','created'].some(k=>j[k]!=null&&typeof j[k]!=='string'))throw Error('Vaga inválida no backup');
   ids.add(j.id);
  }
  if(['name','email','summary','cv'].some(k=>typeof raw.profile[k]!=='string')||(raw.profile.cv&&!url(raw.profile.cv)))throw Error('Perfil inválido');
  if(['keywords','template'].some(k=>typeof raw.rules[k]!=='string')||['remote','auto'].some(k=>typeof raw.rules[k]!=='boolean'))throw Error('Regras inválidas');
  const result={...structuredClone(defaults),...raw,profile:{...defaults.profile,...raw.profile},rules:{...defaults.rules,...raw.rules}};
  result.jobs=raw.jobs.map(j=>({...j,description:j.description||'',notes:j.notes||'',draft:j.draft||'',location:j.location||''}));
  const d=raw.discovery;
  if(d!=null&&(!object(d)||!Array.isArray(d.sources)||d.sources.length>20||d.sources.some(s=>!sourceValid(s))||!Array.isArray(d.jobs)||d.jobs.some(j=>!discoveryJob(j))))throw Error('Dados de busca inválidos');
  result.discovery=d?{...d,interval:[15,60].includes(d.interval)?d.interval:0}:{sources:[],jobs:[],lastRun:null,interval:0};
  if(raw.applications!=null&&(!object(raw.applications)||Object.values(raw.applications).some(a=>!object(a)||typeof a.draft!=='string'||typeof a.status!=='string')))throw Error('Revisões inválidas');
  result.applications={...raw.applications};
  if(raw.matchSettings!=null){
   const c=raw.matchSettings;if(!object(c)||['levels','excluded','cities','keywords','forbidden'].some(k=>c[k]!=null&&typeof c[k]!=='string')||['skillWeight','modeWeight','levelWeight'].some(k=>c[k]!=null&&(!Number.isFinite(c[k])||c[k]<0||c[k]>100)))throw Error('Filtros inválidos');
  }
  return result;
 }
 function mergeJobs(existing,incoming,source,complete){
  if(!Array.isArray(incoming)||incoming.some(j=>!discoveryJob(j)||j.source!==source.provider||j.board!==source.board))throw Error('Resposta da fonte inválida');
  const ids=new Set(incoming.map(j=>j.sourceId));
  const result=existing.map(j=>j.source===source.provider&&j.board===source.board&&complete?{...j,closed:!ids.has(j.sourceId)}:{...j});
  for(const j of incoming){const index=result.findIndex(x=>x.sourceId===j.sourceId);if(index>=0)result[index]={...result[index],...j,closed:false};else result.push({...j,closed:false});}
  return result;
 }
 root.CareerData={restore,url,canonical,sourceValid,discoveryJob,mergeJobs};
})(typeof module!=='undefined'?module.exports:globalThis);
