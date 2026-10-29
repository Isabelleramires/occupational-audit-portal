'use strict';
const http = require('node:http');
const {readFile} = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {profiles,rows} = require('./data');
const {withinScope,filterRows,metrics,trend,issueSummary,performance,treatmentsFor,toCsv} = require('./domain');

const PUBLIC_DIR = path.resolve(__dirname,'../public');
const SESSION_MAX_MS=8*60*60*1000, INACTIVITY_MS=30*60*1000;
const sessions=new Map();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const send=(res,status,body,type='application/json; charset=utf-8',extra={})=>{
  res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",...extra});
  res.end(typeof body==='string' || Buffer.isBuffer(body)?body:JSON.stringify(body));
};
function getSession(req) {
  const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('audit_demo_session='))?.slice('audit_demo_session='.length);
  if(!token || !sessions.has(token)) return null;
  const s=sessions.get(token), now=Date.now();
  if(now-s.created>SESSION_MAX_MS || now-s.lastActive>INACTIVITY_MS){sessions.delete(token);return null;}
  s.lastActive=now;return s;
}
const cookie=(value,maxAge=0)=>`audit_demo_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
function readBody(req){return new Promise((resolve,reject)=>{
  let text='';req.on('data',chunk=>{text+=chunk;if(text.length>20000){reject(new Error('Limite da requisição excedido.'));req.destroy();}});
  req.on('end',()=>{try{resolve(text?JSON.parse(text):{});}catch{reject(new Error('JSON inválido.'));}});
  req.on('error',reject);
});}
function visibleData(session, url) {
  const scoped=withinScope(rows,session.profile.id);
  const company=url.searchParams.get('company')||'Todas';
  const unit=url.searchParams.get('unit')||'Todas';
  const from=url.searchParams.get('from')||'';
  const to=url.searchParams.get('to')||'';
  return {scoped,filtered:filterRows(scoped,{company,unit,from,to})};
}
async function handle(req,res){
  let url;
  try{url=new URL(req.url,'http://localhost');}catch{return send(res,400,{error:'URL inválida.'});}
  if(req.method==='GET' && url.pathname==='/api/profiles')
    return send(res,200,{profiles:profiles.map(({id,name,subtitle,initials,usesUnits})=>({id,name,subtitle,initials,usesUnits}))});
  if(req.method==='POST' && url.pathname==='/api/session'){
    let payload;try{payload=await readBody(req);}catch(e){return send(res,400,{error:e.message});}
    const profile=profiles.find(x=>x.id===payload.profileId);
    if(!profile)return send(res,400,{error:'Perfil demonstrativo não encontrado.'});
    const token=crypto.randomBytes(32).toString('hex'),now=Date.now();
    sessions.set(token,{profile,created:now,lastActive:now,overrides:new Map()});
    return send(res,200,{profile:{id:profile.id,name:profile.name,usesUnits:profile.usesUnits,role:profile.role}},'application/json; charset=utf-8',{'Set-Cookie':cookie(token,8*60*60)});
  }
  if(req.method==='DELETE' && url.pathname==='/api/session'){
    const tok=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('audit_demo_session='))?.split('=')[1];
    if(tok)sessions.delete(tok);
    return send(res,200,{ok:true},'application/json; charset=utf-8',{'Set-Cookie':cookie('',0)});
  }
  if(url.pathname.startsWith('/api/')){
    const session=getSession(req);
    if(!session)return send(res,401,{error:'Sessão demonstrativa expirada. Selecione um perfil novamente.'});
    const {scoped,filtered}=visibleData(session,url);
    if(req.method==='GET' && url.pathname==='/api/session')
      return send(res,200,{profile:{id:session.profile.id,name:session.profile.name,initials:session.profile.initials,role:session.profile.role,usesUnits:session.profile.usesUnits}});
    if(req.method==='GET' && url.pathname==='/api/dashboard')return send(res,200,{
      profile:{id:session.profile.id,name:session.profile.name,initials:session.profile.initials,role:session.profile.role,usesUnits:session.profile.usesUnits},
      options:{companies:[...new Set(scoped.map(r=>r.company))],units:[...new Set(scoped.map(r=>r.unit).filter(Boolean))]},
      metrics:metrics(filtered),trend:trend(filtered),issueTypes:issueSummary(filtered),
      performance:performance(filtered,session.profile.usesUnits),audits:filtered.slice().reverse(),
      treatments:treatmentsFor(filtered,session.overrides)
    });
    if(req.method==='GET' && url.pathname==='/api/export')return send(res,200,'\uFEFF'+toCsv(filtered),'text/csv; charset=utf-8',{'Content-Disposition':'attachment; filename="auditorias-demonstrativas.csv"'});
    const match=url.pathname.match(/^\/api\/audits\/([A-Za-z0-9-]+)$/);
    if(req.method==='GET' && match){
      const audit=scoped.find(a=>a.id===match[1]);
      return audit?send(res,200,{audit}):send(res,404,{error:'Auditoria não encontrada neste perfil.'});
    }
    if(req.method==='POST' && url.pathname==='/api/treatment'){
      let payload;try{payload=await readBody(req);}catch(e){return send(res,400,{error:e.message});}
      const id=String(payload.auditId||'');
      const row=scoped.find(r=>r.id===id && r.issues>0);
      if(!row)return send(res,404,{error:'Tratativa não encontrada neste perfil.'});
      const allowed=['Aguardando retorno','Em análise','Correção solicitada','Resolvida'];
      if(!allowed.includes(payload.status))return send(res,400,{error:'Status inválido.'});
      if(typeof payload.note!=='string' || payload.note.length>180)return send(res,400,{error:'Observação inválida (máximo de 180 caracteres).'});
      session.overrides.set(id,{status:payload.status,note:payload.note.trim()});
      return send(res,200,{ok:true,status:payload.status});
    }
    return send(res,404,{error:'Rota não encontrada.'});
  }
  if(req.method!=='GET' && req.method!=='HEAD')return send(res,405,{error:'Método não permitido.'});
  const rel=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if(!['index.html','style.css','app.js','favicon.svg'].includes(rel))return send(res,404,'Página não encontrada.','text/plain; charset=utf-8');
  try{
    const file=await readFile(path.join(PUBLIC_DIR,rel));
    send(res,200,req.method==='HEAD'?'':file,mime[path.extname(rel)]||'application/octet-stream');
  }catch{return send(res,404,'Página não encontrada.','text/plain; charset=utf-8');}
}
function createServer(){return http.createServer((req,res)=>{handle(req,res).catch(e=>{console.error('Erro de demonstração',e.message);send(res,500,{error:'Não foi possível carregar a demonstração.'});});});}
if(require.main===module){
  const port=Number(process.env.PORT||3000);
  createServer().listen(Number.isInteger(port)&&port>=0&&port<=65535?port:3000,()=>console.log(`Audit Portal Demo: http://localhost:${port}`));
}
module.exports={createServer};
