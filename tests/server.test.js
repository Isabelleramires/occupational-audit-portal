const test=require('node:test');
const assert=require('node:assert/strict');
const {createServer}=require('../src/server');
const {profiles}=require('../src/data');

async function boot(fn){const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));try{await fn(`http://127.0.0.1:${server.address().port}`);}finally{await new Promise(resolve=>server.close(resolve));}}
async function login(base,id){const res=await fetch(base+'/api/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({profileId:id})});assert.equal(res.status,200);return res.headers.get('set-cookie').split(';')[0];}
const get=(url,cookie)=>fetch(url,{headers:cookie?{cookie}:undefined});
test('dashboard is protected by demo session',()=>boot(async base=>{const r=await get(base+'/api/dashboard');assert.equal(r.status,401);}));
test('profile cannot read audit from another tenant',()=>boot(async base=>{
  const one=await login(base,profiles[0].id),two=await login(base,profiles[1].id);
  const data=await (await get(base+'/api/dashboard',one)).json();
  const foreignId=data.audits[0].id;
  assert.equal((await get(base+'/api/audits/'+foreignId,two)).status,404);
}));
test('invalid company filter never increases allowed scope',()=>boot(async base=>{
  const cookie=await login(base,profiles[0].id);
  const normal=await (await get(base+'/api/dashboard',cookie)).json();
  const restricted=await (await get(base+'/api/dashboard?company=Sul%20Opera%C3%A7%C3%B5es&tenantId=demo-sul',cookie)).json();
  assert.ok(normal.metrics.audited>0);assert.equal(restricted.metrics.audited,0);
}));
test('demo treatment may change only within own profile',()=>boot(async base=>{
  const own=await login(base,profiles[0].id),foreign=await login(base,profiles[1].id);
  const dash=await (await get(base+'/api/dashboard',own)).json();const id=dash.treatments[0].auditId;
  const request={method:'POST',headers:{cookie:foreign,'content-type':'application/json'},body:JSON.stringify({auditId:id,status:'Resolvida',note:'teste'})};
  assert.equal((await fetch(base+'/api/treatment',request)).status,404);
  request.headers.cookie=own;assert.equal((await fetch(base+'/api/treatment',request)).status,200);
  const updated=await (await get(base+'/api/dashboard',own)).json();assert.equal(updated.treatments.find(t=>t.auditId===id).status,'Resolvida');
}));
test('CSV is available only to the current demo profile',()=>boot(async base=>{
  const own=await login(base,profiles[0].id);
  const unauth=await get(base+'/api/export');assert.equal(unauth.status,401);
  const r=await get(base+'/api/export',own);assert.equal(r.status,200);
  const csv=await r.text();assert.ok(csv.includes('Norte Serviços'));assert.ok(!csv.includes('Sul Operações'));
}));
test('static source files outside public directory are inaccessible',()=>boot(async base=>{
  assert.equal((await get(base+'/src/data.js')).status,404);
  assert.equal((await get(base+'/package.json')).status,404);
}));
