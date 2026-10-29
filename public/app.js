'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const state={selectedProfile:null,profile:null,data:null,tab:'overview',search:'',loading:false};
const tabNames={overview:'Visão geral',audits:'Auditorias',issues:'Inconsistências',treatments:'Tratativas',performance:'Desempenho',base:'Base demonstrativa'};
const subTitles={overview:'Indicadores consolidados de auditoria do período selecionado.',audits:'Histórico de auditorias por empresa e intervalo.',issues:'Análise das principais ocorrências registradas.',treatments:'Acompanhamento demonstrativo das ações e seus status.',performance:'Comparação de taxas de conclusão entre áreas.',base:'Registros agregados e fictícios usados nesta demonstração.'};
const fmtInt=n=>new Intl.NumberFormat('pt-BR').format(Number(n)||0);
const fmtPercent=n=>new Intl.NumberFormat('pt-BR',{style:'percent',maximumFractionDigits:1,minimumFractionDigits:1}).format(Number(n)||0);
const dateBR=v=>String(v||'').split('-').reverse().join('/');
const shortDate=v=>{const p=String(v||'').split('-');return p.length===3?`${p[2]}/${p[1]}`:v;};
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svgSafe=v=>safe(v);
const prettyMonth=v=>{const [year,month]=String(v).split('-');return ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][Number(month)-1]+'/'+String(year).slice(2);};
function toast(text){const el=$('#toast');el.textContent=text;el.hidden=false;clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>el.hidden=true,4300);}
async function api(route,options={}){
  const response=await fetch(route,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...options});
  const type=response.headers.get('content-type')||'';
  const json=type.includes('json')?await response.json():null;
  if(!response.ok){if(response.status===401){showLogin();}throw new Error(json?.error||`Erro HTTP ${response.status}`);}
  return json;
}
function showLogin(){state.profile=null;state.data=null;$('#workspace').hidden=true;$('#login-page').hidden=false;$('#modal-root').hidden=true;}
function showWorkspace(profile){
  state.profile=profile;$('#login-page').hidden=true;$('#workspace').hidden=false;
  $('#account-name').textContent=profile.name;$('#account-avatar').textContent=profile.initials||'DE';$('#header-avatar').textContent=profile.initials||'DE';
  $('#unit-field').hidden=!profile.usesUnits;
}
async function init(){
  const list=await api('/api/profiles');
  $('#profiles').innerHTML=list.profiles.map(p=>`<button class="profile-card" type="button" data-profile="${safe(p.id)}"><div class="profile-monogram">${safe(p.initials)}</div><div class="profile-body"><strong>${safe(p.name)}</strong><span>${safe(p.subtitle)}</span></div><span class="profile-radio" aria-hidden="true"></span></button>`).join('');
  $$('#profiles .profile-card').forEach(btn=>btn.addEventListener('click',()=>{
    state.selectedProfile=btn.dataset.profile;
    $$('#profiles .profile-card').forEach(c=>c.classList.toggle('selected',c===btn));
    $('#login-btn').disabled=false;
  }));
  try{const session=await api('/api/session');showWorkspace(session.profile);await loadData();}catch(e){if(!String(e.message).includes('Sessão'))console.debug('Sessão inicial não disponível.');}
}
$('#login-btn').addEventListener('click',async()=>{
  try{$('#login-btn').disabled=true;const res=await api('/api/session',{method:'POST',body:JSON.stringify({profileId:state.selectedProfile})});
    showWorkspace({...res.profile,initials:res.profile.name.split(' ').map(w=>w[0]).slice(0,2).join('')});
    $('#from-date').value='';$('#to-date').value='';$('#company').value='Todas';$('#unit').value='Todas';state.tab='overview';state.search='';await loadData();
  }catch(e){toast(e.message);}finally{$('#login-btn').disabled=false;}
});
$('#logout-btn').addEventListener('click',async()=>{await api('/api/session',{method:'DELETE'}).catch(()=>{});showLogin();});
$('#mobile-menu').addEventListener('click',()=>$('.sidebar').classList.toggle('open'));
$$('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{state.tab=btn.dataset.tab;state.search='';$('.sidebar').classList.remove('open');render();}));
function currentQuery(){const q=new URLSearchParams();for(const [key,id] of [['from','from-date'],['to','to-date'],['company','company'],['unit','unit']]){const val=$('#'+id).value;if(val && val!=='Todas')q.set(key,val);}return q.toString();}
async function loadData(){
  $('#page-body').innerHTML='<div class="loading">Carregando dados fictícios...</div>';
  const selectedCompany=$('#company').value, selectedUnit=$('#unit').value;
  try{const data=await api('/api/dashboard?'+currentQuery());state.data=data;showWorkspace(data.profile);
    const companySel=$('#company'),unitSel=$('#unit');
    companySel.innerHTML='<option value="Todas">Todas as empresas</option>'+data.options.companies.map(s=>`<option value="${safe(s)}">${safe(s)}</option>`).join('');
    unitSel.innerHTML='<option value="Todas">Todas as unidades</option>'+data.options.units.map(s=>`<option value="${safe(s)}">${safe(s)}</option>`).join('');
    companySel.value=data.options.companies.includes(selectedCompany)?selectedCompany:'Todas';
    unitSel.value=data.options.units.includes(selectedUnit)?selectedUnit:'Todas';
    render();
  }catch(e){$('#page-body').innerHTML=`<div class="empty"><h3>Não foi possível carregar os dados.</h3><p>${safe(e.message)}</p></div>`;}
}
let delayed=null;
['from-date','to-date','company','unit'].forEach(id=>$('#'+id).addEventListener('change',()=>{clearTimeout(delayed);delayed=setTimeout(loadData,120);}));
$('#refresh-btn').addEventListener('click',()=>loadData().then(()=>toast('Dados fictícios atualizados.')));
$('#clear-btn').addEventListener('click',()=>{$('#from-date').value='';$('#to-date').value='';$('#company').value='Todas';$('#unit').value='Todas';loadData();});
$('#export-btn').addEventListener('click',()=>{if(state.data){window.location.href='/api/export?'+currentQuery();toast('Exportação CSV iniciada.');}});
const card=(label,value,icon,foot,kind='')=>`<article class="stat-card"><div class="stat-label">${label}</div><span class="stat-icon ${kind}">${icon}</span><div class="stat-number">${value}</div><div class="stat-foot">${foot}</div></article>`;
const tag=(status)=>{const cl=status==='Concluída'||status==='Resolvida'?'good':status==='Atenção'?'issue':status==='Em análise'?'neutral':'warn';return `<span class="tag ${cl}">${safe(status)}</span>`;};
const empty=(title,detail)=>`<div class="empty"><h3>${safe(title)}</h3><p>${safe(detail)}</p></div>`;
const section=(title,desc,content)=>`<section class="panel"><div class="panel-header"><div><h2 class="panel-title">${title}</h2><div class="panel-sub">${desc}</div></div></div>${content}</section>`;
function graph(trend){
  if(!trend.length)return empty('Sem dados no período','Altere os filtros para visualizar a evolução.');
  const W=640,H=244,L=46,R=14,T=14,B=34, w=W-L-R,h=H-T-B;
  const rates=trend.map(d=>d.rate*100),n=Math.max(1,rates.length-1);
  const x=i=>L+i*w/n,y=v=>T+h-(v/100)*h;
  const points=rates.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area=[`${L},${T+h}`,points,`${x(rates.length-1)},${T+h}`].join(' ');
  const grid=[0,25,50,75,100].map(v=>`<line x1="${L}" y1="${y(v)}" x2="${W-R}" y2="${y(v)}" stroke="#edf0f6"/><text x="${L-10}" y="${y(v)+4}" text-anchor="end" class="chart-axis-text">${v}%</text>`).join('');
  const labels=trend.map((d,i)=>`<text x="${x(i)}" y="${H-10}" text-anchor="middle" class="chart-axis-text">${prettyMonth(d.period)}</text>`).join('');
  const dots=rates.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4.8" fill="#647ce3" stroke="#fff" stroke-width="2"><title>${svgSafe(prettyMonth(trend[i].period))}: ${fmtPercent(trend[i].rate)}</title></circle>`).join('');
  return `<svg class="line-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Taxa mensal de conclusão das auditorias"><defs><linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#647ce3" stop-opacity=".18"/><stop offset="1" stop-color="#647ce3" stop-opacity="0"/></linearGradient></defs>${grid}<polygon points="${area}" fill="url(#fillGrad)"/><polyline points="${points}" fill="none" stroke="#6279e0" stroke-width="3.3" stroke-linejoin="round" stroke-linecap="round"/>${dots}${labels}</svg>`;
}
function topIssues(items){const max=Math.max(1,...items.map(x=>x.count));return items.length?items.slice(0,5).map(x=>`<div class="issue-row"><div><div class="issue-header"><span>${safe(x.name)}</span></div><div class="track"><div class="track-fill" style="width:${100*x.count/max}%"></div></div></div><div class="issue-value">${fmtInt(x.count)}</div></div>`).join(''):empty('Nenhuma ocorrência','Não existem inconsistências para os filtros selecionados.');}
function eventBreakdown(items){return items.map(e=>`<div class="event-row"><span>${safe(e.event)}</span><div class="track"><div class="track-fill" style="width:${e.audited?(e.completed/e.audited)*100:0}%"></div></div><strong>${fmtPercent(e.audited?e.completed/e.audited:0)}</strong></div>`).join('');}
function overview(d){const m=d.metrics;return `
  <section class="stats-grid">${card('Eventos auditados',fmtInt(m.audited),'▦','S-2220 · S-2221 · S-2240')}${card('Taxa de conclusão',fmtPercent(m.rate),'↗','Total concluído / auditado','success')}${card('Eventos pendentes',fmtInt(m.pending),'◷','Aguardando regularização','warning')}${card('Inconsistências',fmtInt(m.issues),'◇','Registros que exigem atenção','danger')}</section>
  <section class="section-grid"><article class="panel"><div class="panel-header"><div><h2 class="panel-title">Evolução da conclusão</h2><div class="panel-sub">Variação mensal da taxa de eventos concluídos</div></div><span class="panel-meta">MENSAL</span></div>${graph(d.trend)}</article><article class="panel"><div class="panel-header"><div><h2 class="panel-title">Principais inconsistências</h2><div class="panel-sub">Ocorrências agrupadas por categoria</div></div><span class="panel-meta">TOP 5</span></div>${topIssues(d.issueTypes)}</article></section>
  <section class="section-grid"><article class="panel"><div class="panel-header"><div><h2 class="panel-title">Conclusão por evento</h2><div class="panel-sub">Proporção de registros concluídos por tipo</div></div></div>${eventBreakdown(m.byEvent)}<div class="split-footer"><span>Base demonstrativa</span><strong>${fmtInt(m.audited)} eventos</strong></div></article><article class="panel"><div class="panel-header"><div><h2 class="panel-title">Panorama operacional</h2><div class="panel-sub">Indicadores de escopo selecionado</div></div></div><div class="report-stats"><div><span>AUDITORIAS</span><strong>${fmtInt(m.audits)}</strong></div><div><span>EMPRESAS</span><strong>${fmtInt(m.companies)}</strong></div><div><span>CONCLUÍDOS</span><strong>${fmtInt(m.completed)}</strong></div></div><div class="info-banner" style="margin:25px 0 0">Este painel utiliza métricas geradas exclusivamente para fins de demonstração. Não representa resultados reais de clientes.</div></article></section>
  <section class="section-heading"><h2>Auditorias recentes</h2><span>Últimos registros do período</span></section>${auditTable(d.audits.slice(0,6),true)}
`;
}
function auditTable(rows,isPreview=false){return `<section class="panel table-panel"><div class="table-top"><h2>${isPreview?'Histórico recente':'Registros de auditoria'}</h2><span class="muted-note">${fmtInt(rows.length)} registros exibidos</span></div><div class="table-scroller"><table><thead><tr><th>Auditoria</th><th>Empresa</th><th>Período</th><th>Eventos</th><th>Conclusão</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${safe(r.id)}</strong></td><td>${safe(r.company)}${r.unit?`<div class="muted-note">${safe(r.unit)}</div>`:''}</td><td>${dateBR(r.periodStart)} – ${dateBR(r.periodEnd)}</td><td>${fmtInt(r.audited)}</td><td><strong>${fmtPercent(r.audited?r.completed/r.audited:0)}</strong></td><td>${tag(r.status)}</td><td><button type="button" class="small-btn" data-audit="${safe(r.id)}">Detalhes ↗</button></td></tr>`).join('') || `<tr><td colspan="7">Sem auditorias para o filtro selecionado.</td></tr>`}</tbody></table></div>${!isPreview?'<div class="table-footer"><span>Sem acesso a auditorias reais</span><span>Dados simulados</span></div>':''}</section>`;}
function audits(d){const term=state.search.toLowerCase();const found=d.audits.filter(r=>[r.id,r.company,r.unit,r.status].join(' ').toLowerCase().includes(term));return `<div class="info-banner">Cada auditoria abaixo representa um registro agregado criado artificialmente. A abertura dos detalhes não acessa planilhas externas.</div><div class="table-tools" style="margin-bottom:17px"><input class="toolbar-input" id="local-search" placeholder="Buscar por empresa, auditoria ou status" value="${safe(state.search)}"/></div>${auditTable(found)}`;}
function issues(d){const rows=d.audits.filter(r=>r.issues>0);const term=state.search.toLowerCase();return `<div class="section-grid"><article class="panel"><div class="panel-header"><div><h2 class="panel-title">Categorias de ocorrências</h2><div class="panel-sub">Distribuição no período selecionado</div></div></div>${topIssues(d.issueTypes)}</article><article class="panel"><div class="panel-header"><div><h2 class="panel-title">Visão de inconsistências</h2><div class="panel-sub">Registros que demandam análise</div></div></div><div class="report-stats"><div><span>OCORRÊNCIAS</span><strong>${fmtInt(d.metrics.issues)}</strong></div><div><span>AUDITORIAS AFETADAS</span><strong>${fmtInt(rows.length)}</strong></div></div><p class="muted-note" style="margin-top:35px">Categorias ilustrativas, não derivadas de dados de funcionários.</p></article></div><div class="table-tools" style="margin-bottom:16px"><input class="toolbar-input" id="local-search" placeholder="Buscar ocorrência ou empresa" value="${safe(state.search)}"/></div><section class="panel table-panel"><div class="table-top"><h2>Ocorrências por auditoria</h2></div><div class="table-scroller"><table><thead><tr><th>Auditoria</th><th>Empresa</th><th>Categoria</th><th>Quantidade</th><th>Período</th></tr></thead><tbody>${rows.filter(r=>[r.company,r.id,r.mainIssue].join(' ').toLowerCase().includes(term)).map(r=>`<tr><td><strong>${safe(r.id)}</strong></td><td>${safe(r.company)}</td><td>${safe(r.mainIssue)}</td><td><span class="tag issue">${fmtInt(r.issues)} registros</span></td><td>${dateBR(r.periodEnd)}</td></tr>`).join('')||'<tr><td colspan="5">Nenhum registro encontrado.</td></tr>'}</tbody></table></div></section>`;}
function treatments(d){const term=state.search.toLowerCase();const items=d.treatments.filter(t=>[t.auditId,t.company,t.issue,t.status].join(' ').toLowerCase().includes(term));return `<div class="info-banner">As alterações de status e observação são armazenadas apenas na sessão atual, em memória. Não modificam nenhuma planilha nem sistema externo.</div><div class="table-tools" style="margin-bottom:16px"><input class="toolbar-input" id="local-search" placeholder="Buscar tratativa ou empresa" value="${safe(state.search)}"/></div><section class="panel table-panel"><div class="table-top"><h2>Acompanhamento de tratativas</h2><span class="muted-note">${fmtInt(items.length)} itens</span></div><div class="table-scroller"><table><thead><tr><th>Referência</th><th>Empresa</th><th>Ocorrência</th><th>Status</th><th></th></tr></thead><tbody>${items.map(t=>`<tr><td><strong>${safe(t.auditId)}</strong></td><td>${safe(t.company)}</td><td>${safe(t.issue)}</td><td>${tag(t.status)}</td><td><button type="button" class="small-btn" data-treatment="${safe(t.auditId)}">Atualizar ↗</button></td></tr>`).join('')||'<tr><td colspan="5">Nenhuma tratativa encontrada.</td></tr>'}</tbody></table></div></section>`;}
function performance(d){return `<div class="stats-grid">${card('Empresas',fmtInt(d.metrics.companies),'▦','Neste perfil demonstrativo')}${card('Auditorias',fmtInt(d.metrics.audits),'▤','Registros do período')}${card('Eventos',fmtInt(d.metrics.audited),'◎','Volume total analisado')}${card('Taxa geral',fmtPercent(d.metrics.rate),'↗','Conclusão agregada','success')}</div>${section(d.profile.usesUnits?'Desempenho por unidade':'Desempenho por empresa','Ordenado da menor para a maior taxa de conclusão',d.performance.length?d.performance.map(v=>`<div class="performance-row"><div><div class="performance-name">${safe(v.name)}</div><div class="muted-note">${fmtInt(v.audited)} eventos · ${fmtInt(v.issues)} ocorrências</div></div><div class="track"><div class="track-fill" style="width:${v.rate*100}%"></div></div><div class="performance-percent">${fmtPercent(v.rate)}</div></div>`).join(''):empty('Sem dados','Selecione outro intervalo de datas.'))}`;}
function base(d){return `<div class="info-banner"><strong>Modelo de Base Geral independente.</strong> O conjunto abaixo é gerado por código para esta demonstração. Não contém registros de funcionários, códigos corporativos, links de planilhas reais ou integrações com sistemas externos.</div><section class="panel table-panel"><div class="table-top"><h2>Base de dados fictícia</h2><span class="muted-note">${fmtInt(d.audits.length)} registros filtrados</span></div><div class="table-scroller"><table><thead><tr><th>ID fictício</th><th>Empresa</th><th>Unidade</th><th>Início</th><th>Fim</th><th>Auditados</th><th>Concluídos</th><th>Pendentes</th><th>Inconsistências</th></tr></thead><tbody>${d.audits.map(r=>`<tr><td><strong>${safe(r.id)}</strong></td><td>${safe(r.company)}</td><td>${safe(r.unit||'—')}</td><td>${dateBR(r.periodStart)}</td><td>${dateBR(r.periodEnd)}</td><td>${fmtInt(r.audited)}</td><td>${fmtInt(r.completed)}</td><td>${fmtInt(r.pending)}</td><td>${fmtInt(r.issues)}</td></tr>`).join('')||'<tr><td colspan="9">Sem registros.</td></tr>'}</tbody></table></div></section>`;}
function render(){
  const d=state.data;if(!d)return;
  const title=tabNames[state.tab];$('#crumb').textContent=title;$('#page-title').textContent=title;
  $('#page-subtitle').textContent=subTitles[state.tab];
  $('#heading-kicker').textContent=state.tab==='overview'?'PAINEL DE ACOMPANHAMENTO':'PORTAL DO CLIENTE · DADOS FICTÍCIOS';
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));
  const actions={overview,audits,issues,treatments,performance,base};
  $('#page-body').innerHTML=actions[state.tab](d);
  bindPageActions();
}
$('#page-body').addEventListener('input',e=>{
  if(e.target.id!=='local-search')return;
  const pos=e.target.selectionStart;
  state.search=e.target.value;
  render();
  const search=$('#local-search');if(search){search.focus();search.setSelectionRange(pos,pos);}
});
function bindPageActions(){
  $$('[data-audit]').forEach(btn=>btn.addEventListener('click',()=>showAudit(btn.dataset.audit)));
  $$('[data-treatment]').forEach(btn=>btn.addEventListener('click',()=>showTreatment(btn.dataset.treatment)));
}
function modal(title,body){$('#modal-root').innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-label="${safe(title)}"><div class="modal-header"><h2>${safe(title)}</h2><button class="modal-close" type="button" id="modal-close" aria-label="Fechar">×</button></div><div class="modal-body">${body}</div></div>`;$('#modal-root').hidden=false;$('#modal-close').addEventListener('click',closeModal);}
const closeModal=()=>{$('#modal-root').hidden=true;$('#modal-root').innerHTML='';};
$('#modal-root').addEventListener('click',e=>{if(e.target===$('#modal-root'))closeModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
async function showAudit(id){try{const {audit:a}=await api('/api/audits/'+encodeURIComponent(id));modal('Detalhes da auditoria',`<div class="modal-grid"><div><div class="modal-label">IDENTIFICADOR</div><div class="modal-value">${safe(a.id)}</div></div><div><div class="modal-label">EMPRESA</div><div class="modal-value">${safe(a.company)}</div></div><div><div class="modal-label">PERÍODO</div><div class="modal-value">${dateBR(a.periodStart)} a ${dateBR(a.periodEnd)}</div></div><div><div class="modal-label">STATUS</div><div>${tag(a.status)}</div></div></div><div class="modal-divider"></div><div class="report-stats"><div><span>AUDITADOS</span><strong>${fmtInt(a.audited)}</strong></div><div><span>CONCLUÍDOS</span><strong>${fmtInt(a.completed)}</strong></div><div><span>INCONSISTÊNCIAS</span><strong>${fmtInt(a.issues)}</strong></div></div><div class="modal-divider"></div><div class="panel-sub" style="margin-bottom:14px">Conclusão por evento</div>${eventBreakdown(Object.entries(a.eventBreakdown).map(([event,v])=>({event,audited:v.examined,completed:v.completed})))}<div class="info-banner" style="margin:18px 0 0">Dados simulados, sem link para arquivos operacionais.</div>`);}catch(e){toast(e.message);}}
function showTreatment(id){const t=state.data.treatments.find(x=>x.auditId===id);if(!t)return;
  const options=['Aguardando retorno','Em análise','Correção solicitada','Resolvida'];
  modal('Atualizar tratativa demonstrativa',`<div class="modal-grid"><div><div class="modal-label">AUDITORIA</div><div class="modal-value">${safe(t.auditId)}</div></div><div><div class="modal-label">EMPRESA</div><div class="modal-value">${safe(t.company)}</div></div></div><div class="modal-divider"></div><div class="modal-label">OCORRÊNCIA</div><div class="modal-value" style="margin-bottom:17px">${safe(t.issue)}</div><label class="modal-label" for="treatment-status">STATUS</label><select class="modal-select" id="treatment-status">${options.map(o=>`<option value="${safe(o)}" ${t.status===o?'selected':''}>${safe(o)}</option>`).join('')}</select><label class="modal-label" for="treatment-note">OBSERVAÇÃO FICTÍCIA</label><textarea class="modal-textarea" id="treatment-note" maxlength="180" placeholder="Comentário para esta sessão demonstrativa">${safe(t.note)}</textarea><div class="modal-actions"><button class="btn btn-outline" id="cancel-update">Cancelar</button><button class="btn btn-primary" id="save-update">Salvar alteração</button></div>`);
  $('#cancel-update').addEventListener('click',closeModal);
  $('#save-update').addEventListener('click',async()=>{try{await api('/api/treatment',{method:'POST',body:JSON.stringify({auditId:t.auditId,status:$('#treatment-status').value,note:$('#treatment-note').value})});closeModal();await loadData();toast('Tratativa simulada atualizada nesta sessão.');}catch(e){toast(e.message);}});
}
init().catch(e=>toast('Não foi possível iniciar a demonstração: '+e.message));
