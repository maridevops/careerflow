/* CareerFlow matching and explicit review extension. */
(function(){
 const R=CareerRules;
 state.matchSettings={...R.settings,...state.matchSettings};
 state.applications=state.applications||{};
 const panel=document.createElement('section');panel.id='matching';panel.className='panel form-panel';panel.hidden=true;
 document.querySelector('footer').before(panel);
 const nav=document.createElement('button');nav.textContent='◎ Match e revisão';nav.dataset.view='matching';document.querySelector('nav').append(nav);
 const originalView=view;
 view=function(name){panel.hidden=name!=='matching';if(name!=='matching')return originalView(name);
 ['dashboard','jobs','bottom','rules','profile'].forEach(id=>$('#'+id).hidden=true);
 $('#title').textContent='Vagas que fazem sentido para você.';$('#subtitle').textContent='Compare requisitos, revise o texto e aprove cada candidatura.';$('#pageLabel').textContent='Match e revisão';$('#addTop').hidden=false;
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b===nav));draw();};
 nav.onclick=()=>view('matching');
 const locationLabel=document.createElement('label');locationLabel.innerHTML='Localização / elegibilidade<input name="location" maxlength="160" placeholder="Ex.: Remoto Brasil ou Brasília — conforme a vaga">';
 $('#jobForm').elements.description.parentElement.before(locationLabel);
 const reviewDialog=document.createElement('dialog');reviewDialog.id='reviewDialog';document.body.append(reviewDialog);
 let selected=new Set(),filter='all';
 function check(job){return R.evaluate(job,state.profile,state.matchSettings);}
 function draw(){
 state.matchSettings={...R.settings,...state.matchSettings};state.applications=state.applications||{};
 const entries=state.jobs.map(job=>({job,match:check(job)})).sort((a,b)=>(b.job.mode==='Remoto')-(a.job.mode==='Remoto')||b.match.score-a.match.score||String(b.job.created).localeCompare(String(a.job.created)));
 const shown=entries.filter(({job,match})=>filter==='all'||(filter==='eligible'&&match.eligible)||(filter==='approved'&&R.isApproved(state.applications[job.id],job,state.profile)));
 panel.innerHTML='<div class="eyebrow">REVISÃO ANTES DE QUALQUER ENVIO</div><h2>Match e candidaturas</h2><p>A pontuação compara as tecnologias da descrição com o resumo salvo em Perfil e currículo. Complete e confira esse resumo primeiro. Não representa garantia de contratação.</p><div class="notice">Envio automático não conectado. A aprovação salva sua revisão; ela não envia a candidatura. Dados e rascunhos ficam neste navegador, sem criptografia fornecida pelo aplicativo.</div><div class="details-actions"><button class="secondary" id="matchConfig">Configurar filtros</button><button class="secondary" id="exportApproved">Exportar aprovadas selecionadas</button><select id="matchFilter" aria-label="Filtrar análise"><option value="all">Todas as vagas</option><option value="eligible">Sem pendências de filtro</option><option value="approved">Aprovadas e atuais</option></select></div><div id="matchRows">'+(shown.length?shown.map(({job:j,match:m})=>{
 const a=state.applications[j.id],approved=R.isApproved(a,j,state.profile);
 return '<article class="notice" style="background:#f7f9f6"><label class="check"><input type="checkbox" data-select="'+esc(j.id)+'" '+(selected.has(j.id)?'checked':'')+'>Selecionar para exportação</label><h3>'+esc(j.role)+' · '+esc(j.company)+'</h3><strong>'+m.score+'/100</strong> · '+esc(j.mode)+'<p>Encontradas no perfil: '+esc(m.matched.join(', ')||'Nenhuma')+'<br>Não identificadas no perfil: '+esc(m.missing.join(', ')||'Nenhuma')+'</p><p>'+esc([...m.reasons,...m.uncertain].join(' · ')||'Sem pendências de filtro')+'</p><span class="badge">'+(approved?'Aprovada':a?.status==='aprovada'?'Revisão desatualizada':a?.status==='descartada'?'Descartada':'Pendente de revisão')+'</span> <button class="text-btn" data-review="'+esc(j.id)+'">Revisar candidatura →</button></article>';
 }).join(''):'<p>Nenhuma vaga nesta visualização. Adicione uma vaga ou altere o filtro.</p>')+'</div>';
 $('#matchFilter').value=filter;$('#matchFilter').onchange=e=>{filter=e.target.value;draw();};
 panel.querySelectorAll('[data-select]').forEach(el=>el.onchange=()=>el.checked?selected.add(el.dataset.select):selected.delete(el.dataset.select));
 panel.querySelectorAll('[data-review]').forEach(el=>el.onclick=()=>review(el.dataset.review));
 $('#matchConfig').onclick=config;
 $('#exportApproved').onclick=()=>{
 const items=state.jobs.filter(j=>selected.has(j.id)&&R.isApproved(state.applications[j.id],j,state.profile)).map(j=>({vaga:j.role,empresa:j.company,url:j.url,...state.applications[j.id]}));
 if(!items.length)return toast('Revise, aprove e selecione pelo menos uma candidatura.');
 download(JSON.stringify({exportedAt:new Date().toISOString(),applications:items},null,2),'application/json','candidaturas-aprovadas.json');toast(items.length+' candidatura(s) exportada(s). Nenhum envio realizado.');
 };
 }
 function review(jid){
 const j=state.jobs.find(j=>j.id===jid),a=state.applications[jid],m=check(j),fp=R.fingerprint(j,state.profile);
 const draft=a&&a.fingerprint===fp?a.draft:message(j);
 reviewDialog.innerHTML='<div class="dialog-head"><h2>'+esc(j.role)+'</h2><button class="close" id="reviewClose" aria-label="Fechar">×</button></div><p>'+esc(j.company)+' · '+m.score+'/100</p><p class="detail-text">'+esc(j.description||'Sem descrição informada')+'</p><p>Skills presentes: '+esc(m.matched.join(', ')||'Nenhuma')+'<br>Skills não identificadas: '+esc(m.missing.join(', ')||'Nenhuma')+'</p><p class="detail-text">'+esc([...m.reasons,...m.uncertain].join(' · '))+'</p><label>Localização conforme a vaga<input id="reviewLocation" value="'+esc(j.location||'')+'"></label><label>Mensagem editável<textarea id="reviewDraft" rows="8">'+esc(draft)+'</textarea></label><label class="check"><input type="checkbox" id="reviewConfirmed">Revisei a vaga, os requisitos e a mensagem. Confirmo que as informações são verdadeiras.</label><div class="details-actions"><button class="secondary" id="saveReview">Salvar rascunho</button><button class="primary" id="approveReview" disabled>Aprovar este item</button><button class="text-btn danger" id="discardReview">Descartar</button></div><small>Aprovar não envia. Alterações no perfil ou no texto exigem nova revisão.</small>';
 $('#reviewClose').onclick=()=>reviewDialog.close();
 $('#reviewConfirmed').onchange=e=>$('#approveReview').disabled=!e.target.checked;
 $('#reviewDraft').oninput=$('#reviewLocation').oninput=()=>{$('#reviewConfirmed').checked=false;$('#approveReview').disabled=true;};
 function persist(status){
 const draft=$('#reviewDraft').value.trim();if(status==='aprovada'&&(!$('#reviewConfirmed').checked||!draft))return toast('Revise e confirme a mensagem antes de aprovar.');
 j.location=$('#reviewLocation').value.trim();
 state.applications[jid]={draft,status,reviewed:status==='aprovada',approvedAt:status==='aprovada'?new Date().toISOString():null,fingerprint:R.fingerprint(j,state.profile),updatedAt:new Date().toISOString()};
 if(!save())return;draw();reviewDialog.close();toast(status==='aprovada'?'Candidatura aprovada. Nenhum envio realizado.':'Revisão salva.');
 }
 $('#saveReview').onclick=()=>persist('pendente de revisão');$('#approveReview').onclick=()=>persist('aprovada');$('#discardReview').onclick=()=>persist('descartada');
 reviewDialog.showModal();
 }
 function config(){
 const c=state.matchSettings;
 const fields=[['levels','Termos de nível Pleno'],['excluded','Níveis excluídos'],['cities','Cidades aceitas para híbrido'],['keywords','Áreas de interesse'],['forbidden','Palavras proibidas']];
 reviewDialog.innerHTML='<div class="dialog-head"><h2>Filtros e pesos</h2><button class="close" id="reviewClose" aria-label="Fechar">×</button></div><form id="matchSettingsForm">'+fields.map(([key,label])=>'<label>'+label+'<input name="'+key+'" value="'+esc(c[key])+'"><small>Separe os termos por vírgula.</small></label>').join('')+['skillWeight','modeWeight','levelWeight'].map((key,i)=>'<label>'+['Peso das tecnologias','Peso da modalidade','Peso do nível'][i]+'<input type="number" min="0" max="100" required name="'+key+'" value="'+esc(c[key])+'"></label>').join('')+'<label class="check"><input type="checkbox" name="remote" '+(c.remote?'checked':'')+'>Aceitar remoto</label><label class="check"><input type="checkbox" name="hybrid" '+(c.hybrid?'checked':'')+'>Aceitar híbrido</label><button class="primary">Salvar filtros</button></form><p>Os pesos são normalizados para 100. Localizações não informadas permanecem como pendências. A descrição deve confirmar a elegibilidade para o Brasil.</p>';
 $('#reviewClose').onclick=()=>reviewDialog.close();$('#matchSettingsForm').onsubmit=e=>{e.preventDefault();let f=e.target,next=Object.fromEntries(new FormData(f));for(const k of ['skillWeight','modeWeight','levelWeight'])next[k]=Number(next[k]);if(next.skillWeight+next.modeWeight+next.levelWeight===0)return toast('Pelo menos um peso deve ser maior que zero.');next.remote=f.elements.remote.checked;next.hybrid=f.elements.hybrid.checked;state.matchSettings=next;if(save()){reviewDialog.close();draw();toast('Filtros atualizados');}};
 reviewDialog.showModal();
 }
 const profileSubmit=$('#profileForm').onsubmit;
 $('#profileForm').onsubmit=e=>{profileSubmit(e);if(state.applications&&Object.values(state.applications).some(a=>a.status==='aprovada'))toast('Perfil atualizado. Revise novamente as candidaturas afetadas.');};
})();
