/* Read-only discovery; importing a job never sends an application. */
(function(){
 const D=CareerData,panel=document.createElement('section');panel.id='discovery';panel.className='panel form-panel';panel.hidden=true;document.querySelector('footer').before(panel);
 const nav=document.createElement('button');nav.dataset.view='discovery';nav.textContent='⌕ Buscar oportunidades';document.querySelector('nav').append(nav);
 const previous=view;view=function(name){panel.hidden=name!=='discovery';if(name!=='discovery')return previous(name);previous('jobs');$('#jobs').hidden=true;$('#addTop').hidden=true;$('#title').textContent='Seu radar, além das fronteiras.';$('#subtitle').textContent='Consulte vagas reais em páginas públicas de empresas.';$('#pageLabel').textContent='Buscar oportunidades';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b===nav));draw();};nav.onclick=()=>view('discovery');
 let busy=false,errors=[],query='',area='',remoteOnly=false,showClosed=false,page=0,controller,timer,generation=0;
 const areas={cloud:/cloud|nuvem|nube|infrastructure|infraestrutura/i,devops:/devops|devsecops|platform|plataforma|ci\/cd|kubernetes/i,sre:/\bsre\b|reliability|confiabilidade|observability|observabilidade/i};
 function data(){return state.discovery||(state.discovery={sources:[],jobs:[],lastRun:null,interval:0});}
 function draw(){
 const d=data(),seen=new Set();
 const list=d.jobs.filter(j=>{
  if((j.closed&&!showClosed)||(!showClosed&&!d.sources.some(s=>s.provider===j.source&&s.board===j.board)))return false;
  const id=canonical(j.url);if(seen.has(id))return false;seen.add(id);
  return (!query||(j.role+' '+j.company+' '+j.location).toLowerCase().includes(query.toLowerCase()))&&(!area||areas[area].test(j.role+' '+j.description))&&(!remoteOnly||j.mode==='Remoto');
 });
 const pages=Math.max(1,Math.ceil(list.length/50));page=Math.max(0,Math.min(page,pages-1));
 panel.innerHTML='<h2>Oportunidades globais</h2><p>Adicione o identificador da página de carreiras de cada empresa. A consulta cobre somente essas fontes; não pesquisa toda a internet. Remoto não confirma contratação no Brasil.</p><form id="sourceForm"><div class="two"><label>Fonte<select name="provider"><option value="greenhouse">Greenhouse</option><option value="lever">Lever global</option><option value="lever-eu">Lever Europa</option><option value="ashby">Ashby</option></select></label><label>Identificador da empresa<input name="board" required pattern="[a-zA-Z0-9_-]{1,80}" placeholder="Identificador na URL da página"></label></div><small>Em jobs.lever.co/empresa ou job-boards.greenhouse.io/empresa, use empresa. Confira a identidade da empresa no anúncio original.</small><button class="secondary" '+(busy?'disabled':'')+'>Adicionar fonte</button></form><div id="sources">'+d.sources.map((s,i)=>'<p>'+esc(s.provider)+' / '+esc(s.board)+' <button class="text-btn" data-remove="'+i+'" '+(busy?'disabled':'')+'>Remover fonte</button></p>').join('')+'</div><div class="details-actions"><button class="primary" id="collect" '+(busy||!d.sources.length?'disabled':'')+'>'+(busy?'Consultando fontes…':'Buscar vagas agora')+'</button><button class="secondary" id="cancelCollect" '+(!busy?'hidden':'')+'>Cancelar busca</button><label>Atualizar com a aba aberta<select id="refresh"><option value="0">Manualmente</option><option value="15">A cada 15 minutos</option><option value="60">A cada hora</option></select></label></div><p role="status">'+(d.lastRun?'Última consulta com sucesso: '+new Date(d.lastRun).toLocaleString('pt-BR'):'Nenhuma consulta com sucesso.')+' · '+list.length+' vagas no filtro</p>'+errors.map(x=>'<p role="alert">'+esc(x)+'</p>').join('')+'<div class="filters"><input id="discoverySearch" aria-label="Buscar cargo, empresa ou localização" placeholder="Cargo, empresa ou localização" value="'+esc(query)+'"><select id="area" aria-label="Área"><option value="">Todas as áreas</option><option value="cloud">Cloud Engineering</option><option value="devops">DevOps / Platform</option><option value="sre">SRE / Observabilidade</option></select><label class="check"><input id="onlyRemote" type="checkbox" '+(remoteOnly?'checked':'')+'>Remoto informado pela fonte</label><label class="check"><input id="showClosed" type="checkbox" '+(showClosed?'checked':'')+'>Incluir histórico de fontes e vagas ausentes</label></div><div id="discoveryRows">'+(list.length?list.slice(page*50,page*50+50).map(j=>{
 const saved=state.jobs.some(x=>canonical(x.url)===canonical(j.url));
 return '<article class="notice"><h3>'+esc(j.role)+'</h3><p>'+esc(j.company)+' · '+esc(j.location||'Localização não informada')+' · '+esc(j.mode)+'</p><small>'+esc(j.source)+' · '+(j.closed?'Não consta na última consulta completa':'Listada na consulta de '+new Date(j.checkedAt).toLocaleString('pt-BR'))+' · '+esc(j.eligibility||'Confira a elegibilidade no anúncio')+'</small><p>'+esc(j.description?j.description.slice(0,350)+(j.description.length>350?'…':''):'Descrição indisponível. Consulte o anúncio original.')+'</p>'+(j.descriptionTruncated?'<p>Descrição parcial. Confira todos os requisitos na fonte.</p>':'')+'<div class="details-actions"><a class="secondary" href="'+esc(safeUrl(j.url))+'" target="_blank" rel="noopener">Ver vaga ↗</a><button class="primary" data-save-source="'+esc(j.sourceId)+'" '+(j.closed||saved?'disabled':'')+'>'+(saved?'Já salva':'Salvar no meu radar')+'</button></div></article>';
 }).join(''):'<p>Nenhuma vaga para exibir. Adicione uma fonte, faça a busca ou ajuste os filtros. Se a fonte falhou, o erro aparece acima.</p>')+'</div><div class="details-actions"><button class="secondary" id="prevJobs" '+(page===0?'disabled':'')+'>Anterior</button><span>Página '+(page+1)+' de '+pages+'</span><button class="secondary" id="nextJobs" '+(page>=pages-1?'disabled':'')+'>Próxima</button></div><p>Dados salvos neste navegador. Nenhuma candidatura é enviada. Atualizações automáticas ocorrem somente com a aba aberta e visível.</p>';
 $('#area').value=area;$('#refresh').value=String(d.interval||0);
 $('#sourceForm').onsubmit=e=>{e.preventDefault();if(busy)return;const s=Object.fromEntries(new FormData(e.target));s.board=s.board.trim();if(!D.sourceValid(s))return toast('Confira a fonte e o identificador');if(d.sources.length>=20)return toast('Limite de 20 fontes');if(d.sources.some(x=>x.board===s.board&&x.provider===s.provider))return toast('Fonte já adicionada');d.sources.push(s);if(save())draw();};
 panel.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{if(busy)return;d.sources.splice(Number(b.dataset.remove),1);if(save())draw();});
 $('#collect').onclick=collect;$('#cancelCollect').onclick=cancel;
 $('#refresh').onchange=e=>{d.interval=Number(e.target.value);if(save())schedule();};
 $('#discoverySearch').onchange=e=>{query=e.target.value;page=0;draw();};
 $('#area').onchange=e=>{area=e.target.value;page=0;draw();};$('#onlyRemote').onchange=e=>{remoteOnly=e.target.checked;page=0;draw();};$('#showClosed').onchange=e=>{showClosed=e.target.checked;page=0;draw();};
 $('#prevJobs').onclick=()=>{page--;draw();};$('#nextJobs').onclick=()=>{page++;draw();};
 panel.querySelectorAll('[data-save-source]').forEach(b=>b.onclick=()=>{
 const j=data().jobs.find(x=>x.sourceId===b.dataset.saveSource);if(!j||j.closed||state.jobs.some(x=>canonical(x.url)===canonical(j.url)))return;
 state.jobs.push({...j,id:crypto.randomUUID(),created:new Date().toISOString(),status:'Salva',draft:'',notes:'Importada de '+j.source+'. Elegibilidade deve ser revisada.'});
 if(save()){render();draw();toast('Vaga salva. Abra Match e revisão para conferir.');}
 });
 }
 function cancel(){generation++;controller?.abort();busy=false;errors.push('Busca interrompida. Resultados já salvos foram preservados.');draw();}
 async function collect(){
 if(busy||!data().sources.length)return;busy=true;errors=[];const run=++generation;draw();
 try{
  for(const source of [...data().sources]){
   if(run!==generation)break;
   controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),22000);
   try{
    const r=await fetch('/.netlify/functions/jobs?'+new URLSearchParams(source),{signal:controller.signal});
    let result;try{result=await r.json();}catch{throw Error('O serviço de busca não está disponível neste endereço. Use o site publicado no Netlify.');}
    if(!r.ok)throw Error(result.error||'Falha ao consultar a fonte (HTTP '+r.status+')');
    if(run!==generation)return;
    if(!Array.isArray(result.jobs))throw Error('Resposta inválida');
    const d=data();d.jobs=D.mergeJobs(d.jobs,result.jobs,source,result.complete===true);d.lastRun=new Date().toISOString();
    for(const warning of result.warnings||[])errors.push(source.provider+'/'+source.board+': '+warning);
    if(!save()){errors.push('Não foi possível armazenar os resultados. Libere espaço no navegador e tente novamente.');break;}
   }catch(e){if(run!==generation)return;errors.push(source.provider+'/'+source.board+': '+(e.name==='AbortError'?'Tempo de consulta esgotado. Os resultados anteriores foram preservados.':e.message));}
   finally{clearTimeout(timeout);}
  }
 }finally{if(run===generation){busy=false;controller=null;draw();}}
 }
 function schedule(){clearInterval(timer);const minutes=data().interval;if([15,60].includes(minutes))timer=setInterval(()=>{if(!document.hidden&&!busy&&data().sources.length)collect();},minutes*60000);}
 window.addEventListener('careerflow:change',()=>{if(!panel.hidden&&!busy)draw();});
 window.addEventListener('careerflow:restore',()=>{generation++;controller?.abort();busy=false;errors=[];page=0;schedule();if(!panel.hidden)draw();});
 schedule();
})();
