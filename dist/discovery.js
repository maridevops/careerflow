/* Public job boards: read-only discovery. No application submission. */
(function(){
 const panel=document.createElement('section');panel.id='discovery';panel.className='panel form-panel';panel.hidden=true;document.querySelector('footer').before(panel);
 const nav=document.createElement('button');nav.dataset.view='discovery';nav.textContent='⌕ Buscar oportunidades';document.querySelector('nav').append(nav);
 const previous=view;view=function(name){panel.hidden=name!=='discovery';if(name!=='discovery')return previous(name);previous('jobs');$('#jobs').hidden=true;$('#addTop').hidden=true;$('#title').textContent='Seu radar, além das fronteiras.';$('#subtitle').textContent='Consulte vagas reais em páginas públicas de empresas.';$('#pageLabel').textContent='Buscar oportunidades';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b===nav));draw();};nav.onclick=()=>view('discovery');
 state.discovery=state.discovery||{sources:[],jobs:[],lastRun:null};
 let busy=false,errors=[],query='',area='',remoteOnly=false;
 const areas={cloud:/cloud|nuvem|nube|infrastructure|infraestrutura/i,devops:/devops|devsecops|platform|plataforma|ci\/cd|kubernetes/i,sre:/\bsre\b|reliability|confiabilidade|observability|observabilidade/i};
 function draw(){
 const d=state.discovery;
 const list=d.jobs.filter(j=>(!query||(j.role+' '+j.company+' '+j.location).toLowerCase().includes(query.toLowerCase()))&&(!area||areas[area].test(j.role+' '+j.description))&&(!remoteOnly||j.mode==='Remoto'));
 panel.innerHTML='<h2>Oportunidades globais</h2><p>Adicione o identificador da página de carreiras de cada empresa. A consulta cobre somente essas fontes; não pesquisa toda a internet. Remoto não confirma contratação no Brasil.</p><form id="sourceForm"><div class="two"><label>Fonte<select name="provider"><option value="greenhouse">Greenhouse</option><option value="lever">Lever global</option><option value="lever-eu">Lever Europa</option><option value="ashby">Ashby</option></select></label><label>Identificador da empresa<input name="board" required pattern="[a-zA-Z0-9_-]{1,80}" placeholder="Identificador na URL da página"></label></div><small>Exemplo: em jobs.lever.co/empresa, use empresa. O identificador será usado como nome da empresa.</small><button class="secondary" '+(busy?'disabled':'')+'>Adicionar fonte</button></form><div id="sources">'+d.sources.map((s,i)=>'<p>'+esc(s.provider)+' / '+esc(s.board)+' <button class="text-btn" data-remove="'+i+'" '+(busy?'disabled':'')+'>Remover fonte</button></p>').join('')+'</div><div class="details-actions"><button class="primary" id="collect" '+(busy||!d.sources.length?'disabled':'')+'>'+(busy?'Consultando fontes…':'Buscar vagas agora')+'</button><label>Atualizar com a aba aberta<select id="refresh"><option value="0">Manualmente</option><option value="15">A cada 15 minutos</option><option value="60">A cada hora</option></select></label></div><p role="status">'+(d.lastRun?'Última consulta concluída: '+new Date(d.lastRun).toLocaleString('pt-BR'):'Nenhuma consulta concluída.')+' · '+list.length+' vagas no filtro</p>'+errors.map(x=>'<p role="alert">'+esc(x)+'</p>').join('')+'<div class="filters"><input id="discoverySearch" aria-label="Buscar cargo, empresa ou localização" placeholder="Cargo, empresa ou localização" value="'+esc(query)+'"><select id="area" aria-label="Área"><option value="">Todas as áreas</option><option value="cloud">Cloud Engineering</option><option value="devops">DevOps / Platform</option><option value="sre">SRE / Observabilidade</option></select><label class="check"><input id="onlyRemote" type="checkbox" '+(remoteOnly?'checked':'')+'>Remoto confirmado pela fonte</label></div><div id="discoveryRows">'+list.slice(0,150).map(j=>'<article class="notice"><h3>'+esc(j.role)+'</h3><p>'+esc(j.company)+' · '+esc(j.location||'Localização não informada')+' · '+esc(j.mode)+'</p><small>'+esc(j.source)+' · '+(j.closed?'Não consta na última consulta':'Listada na última consulta')+' · '+esc(j.eligibility)+'</small><p>'+esc(j.description.slice(0,350))+'…</p><div class="details-actions"><a class="secondary" href="'+esc(safeUrl(j.url))+'" target="_blank" rel="noopener">Ver vaga ↗</a><button class="primary" data-save-source="'+esc(j.sourceId)+'" '+(j.closed||state.jobs.some(x=>canonical(x.url)===canonical(j.url))?'disabled':'')+'>'+(state.jobs.some(x=>canonical(x.url)===canonical(j.url))?'Já salva':'Salvar no meu radar')+'</button></div></article>').join('')+'</div><p>Exibindo até 150 resultados por filtro. Dados salvos neste navegador. Nenhuma candidatura é enviada. Consultas pausam com a aba fechada.</p>';
 $('#area').value=area;$('#refresh').value=String(d.interval||0);
 $('#sourceForm').onsubmit=e=>{e.preventDefault();const s=Object.fromEntries(new FormData(e.target));if(d.sources.length>=20)return toast('Limite de 20 fontes por navegador');if(d.sources.some(x=>x.board===s.board&&x.provider===s.provider))return toast('Fonte já adicionada');d.sources.push(s);save();draw();};
 panel.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{d.sources.splice(Number(b.dataset.remove),1);save();draw();});
 $('#collect').onclick=collect;
 $('#refresh').onchange=e=>{d.interval=Number(e.target.value);save();schedule();};
 $('#discoverySearch').onchange=e=>{query=e.target.value;draw();};$('#area').onchange=e=>{area=e.target.value;draw();};$('#onlyRemote').onchange=e=>{remoteOnly=e.target.checked;draw();};
 panel.querySelectorAll('[data-save-source]').forEach(b=>b.onclick=()=>{
 const j=d.jobs.find(x=>x.sourceId===b.dataset.saveSource);if(!j||state.jobs.some(x=>canonical(x.url)===canonical(j.url)))return;
 state.jobs.push({...j,id:crypto.randomUUID(),created:new Date().toISOString(),status:'Salva',draft:'',notes:'Importada de '+j.source+'. Elegibilidade deve ser revisada.'});
 if(save()){render();draw();toast('Vaga salva. Confira o perfil e abra Match e revisão.');}
 });
 }
 async function collect(){
 if(busy)return;busy=true;errors=[];draw();
 const d=state.discovery;
 for(const source of [...d.sources]){
 try{
 const r=await fetch('/.netlify/functions/jobs?'+new URLSearchParams(source),{signal:AbortSignal.timeout(20000)});
 if(!r.ok){let error;try{error=(await r.json()).error;}catch{}throw Error(error||'Falha ao consultar a fonte');}
 const result=await r.json();if(!Array.isArray(result.jobs))throw Error('Resposta inválida');
 const incoming=new Map(result.jobs.map(j=>[j.sourceId,j]));
 d.jobs=d.jobs.map(j=>j.source===source.provider&&j.board===source.board?{...j,closed:!incoming.has(j.sourceId)}:j);
 for(const j of incoming.values()){const i=d.jobs.findIndex(x=>x.sourceId===j.sourceId||canonical(x.url)===canonical(j.url));if(i>=0)d.jobs[i]={...d.jobs[i],...j,closed:false};else d.jobs.push({...j,closed:false});}
 }catch(e){errors.push(source.provider+'/'+source.board+': '+e.message);}
 }
 d.lastRun=new Date().toISOString();busy=false;save();draw();
 }
 let timer;
 function schedule(){clearInterval(timer);const minutes=state.discovery.interval;if([15,60].includes(minutes))timer=setInterval(()=>{if(!document.hidden&&state.discovery.sources.length)collect();},minutes*60000);}
 schedule();
})();
