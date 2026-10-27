(function(root){
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const terms = value => String(value || '').split(',').map(s=>s.trim()).filter(Boolean);
const catalog = {'Azure':['azure'],'Terraform':['terraform'],'Kubernetes':['kubernetes','k8s'],'GitHub Actions':['github actions','gh actions'],'Docker':['docker'],'AWS':['aws','amazon web services'],'Python':['python'],'Linux':['linux'],'CI/CD':['ci/cd','ci cd','continuous integration'],'Jenkins':['jenkins'],'Ansible':['ansible'],'Prometheus':['prometheus'],'Grafana':['grafana'],'SQL':['sql'],'PowerShell':['powershell'],'Git':['git']};
function includesTerm(text, term){
 const escaped=normalize(term).split('').map(c=>'\\^$.*+?()[]{}|'.includes(c)?'\\'+c:c).join('');
 return new RegExp('(^|[^a-z0-9])'+escaped+'(?=$|[^a-z0-9])','i').test(normalize(text));
}
function skills(text){return Object.entries(catalog).filter(([,aliases])=>aliases.some(a=>includesTerm(text,a))).map(([name])=>name);}
const settings={levels:'Pleno, Mid, Mid-level, Intermediate, II',excluded:'Senior, Sênior, Sr, Junior, Júnior, Jr, Estágio, Intern, Staff, Principal, Lead',cities:'Brasília',keywords:'DevOps, SRE, Cloud, Platform, Infrastructure',forbidden:'',remote:true,hybrid:true,skillWeight:70,modeWeight:20,levelWeight:10};
function evaluate(job, profile, config={}){
 const c={...settings,...config},title=job.role||'',text=title+' '+(job.description||'');
 const required=skills(text),owned=skills(profile.summary||'');
 const matched=required.filter(s=>owned.includes(s)),missing=required.filter(s=>!owned.includes(s));
 const reasons=[],uncertain=[];
 if(terms(c.excluded).some(t=>includesTerm(title,t)))reasons.push('Nível excluído pelo filtro');
 const mid=terms(c.levels).some(t=>includesTerm(title,t));
 if(!mid)uncertain.push('Nível Pleno não confirmado');
 if(terms(c.forbidden).some(t=>includesTerm(text,t)))reasons.push('Palavra proibida na descrição');
 if(terms(c.keywords).length&&!terms(c.keywords).some(t=>includesTerm(text,t)))reasons.push('Sem área de interesse identificada');
 if(job.mode==='Presencial')reasons.push('Vaga presencial');
 else if(job.mode==='Remoto'){if(!c.remote)reasons.push('Remoto desativado');if(!/(brasil|brazil|latam|latin america|america latina|worldwide|global)/.test(normalize(job.location)))uncertain.push('Elegibilidade para Brasil/LATAM não confirmada');}
 else if(job.mode==='Híbrido'){if(!c.hybrid)reasons.push('Híbrido desativado');if(!terms(c.cities).some(t=>includesTerm(job.location,t)))uncertain.push('Cidade híbrida não confirmada');}
 else uncertain.push('Modalidade não confirmada');
 if(!required.length)uncertain.push('Nenhuma tecnologia reconhecida na vaga');
 const weights=[c.skillWeight,c.modeWeight,c.levelWeight].map(n=>Math.max(0,Number(n)||0)),total=weights.reduce((a,b)=>a+b,0);
 const points=total?Math.round(100*(weights[0]*(required.length?matched.length/required.length:0)+weights[1]*(job.mode==='Remoto'?1:job.mode==='Híbrido'?.5:0)+weights[2]*(mid?1:0))/total):0;
 return {score:points,matched,missing,reasons,uncertain,eligible:!reasons.length&&!uncertain.length};
}
function fingerprint(job,profile){return JSON.stringify([job.role,job.company,job.url,job.description,job.location,job.mode,profile.name,profile.email,profile.summary,profile.cv]);}
function isApproved(application,job,profile){return Boolean(application&&application.status==='aprovada'&&application.reviewed&&application.approvedAt&&application.fingerprint===fingerprint(job,profile));}
root.CareerRules={settings,terms,skills,evaluate,fingerprint,isApproved};
})(typeof module!=='undefined'?module.exports:globalThis);
