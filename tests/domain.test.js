const test=require('node:test');
const assert=require('node:assert/strict');
const {rows,profiles}=require('../src/data');
const {withinScope,filterRows,metrics,trend,issueSummary,performance,treatmentsFor,toCsv}=require('../src/domain');

test('all generated records belong to synthetic demo tenants',()=>{
  assert.ok(rows.length>100);
  assert.ok(rows.every(r=>profiles.some(p=>p.id===r.tenantId)));
  assert.ok(rows.every(r=>r.id.startsWith('DEMO-')));
});
test('tenant scope does not include other organizations',()=>{
  for(const profile of profiles){const visible=withinScope(rows,profile.id);assert.ok(visible.length);assert.ok(visible.every(r=>r.tenantId===profile.id));}
});
test('empty date filters return full allowed scope',()=>{
  const scoped=withinScope(rows,profiles[0].id);
  assert.equal(filterRows(scoped,{from:'',to:''}).length,scoped.length);
  assert.equal(filterRows(scoped,{from:'2026-08-01',to:''}).length,scoped.length);
});
test('date overlap includes audits crossing requested range',()=>{
  const scoped=withinScope(rows,profiles[0].id);
  const found=filterRows(scoped,{from:'2026-08-06',to:'2026-08-06'});
  assert.ok(found.length);assert.ok(found.every(r=>r.periodStart<='2026-08-06' && r.periodEnd>='2026-08-06'));
});
test('metrics are consistent with record totals',()=>{
  const scoped=withinScope(rows,profiles[1].id);const result=metrics(scoped);
  assert.equal(result.audited,result.completed+result.pending);
  assert.equal(result.audited,result.byEvent.reduce((a,e)=>a+e.audited,0));
  assert.ok(result.rate>=0 && result.rate<=1);
});
test('trend is chronologically ordered',()=>{
  const result=trend(withinScope(rows,profiles[0].id));
  assert.ok(result.length>=5);
  assert.deepEqual(result.map(x=>x.period),result.map(x=>x.period).slice().sort());
});
test('rankings and issues are sorted correctly',()=>{
  const scoped=withinScope(rows,profiles[1].id);
  const issue=issueSummary(scoped);const perf=performance(scoped,true);
  assert.ok(issue.every((x,i)=>i===0||issue[i-1].count>=x.count));
  assert.ok(perf.every((x,i)=>i===0||perf[i-1].rate<=x.rate));
});
test('treatment overrides are isolated from original rows',()=>{
  const scoped=withinScope(rows,profiles[1].id);const first=scoped.find(x=>x.issues>0);
  const map=new Map([[first.id,{status:'Resolvida',note:'Exemplo sem dados pessoais'}]]);
  const item=treatmentsFor(scoped,map).find(t=>t.auditId===first.id);
  assert.equal(item.status,'Resolvida');assert.equal(item.note,'Exemplo sem dados pessoais');
  assert.ok(!Object.hasOwn(first,'note'));
});
test('csv does not include hidden tenant identifiers or production links',()=>{
  const csv=toCsv(withinScope(rows,profiles[0].id));
  assert.ok(csv.startsWith('"id";"company";'));
  assert.ok(!csv.includes('tenantId'));
  assert.ok(!csv.includes('http'));
});
