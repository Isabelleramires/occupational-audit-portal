const {eventTypes, issueTypes} = require('./data');

const safeDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value||'')) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? value : '';
const sum = (records, key) => records.reduce((acc,record)=>acc + (Number(record[key])||0),0);

function withinScope(records, tenantId) {
  return records.filter(row => row.tenantId === tenantId);
}
function filterRows(records, filters={}) {
  let result = records;
  if(filters.company && filters.company !== 'Todas') result = result.filter(row => row.company === filters.company);
  if(filters.unit && filters.unit !== 'Todas') result = result.filter(row => row.unit === filters.unit);
  const from = safeDate(filters.from), to = safeDate(filters.to);
  // No date restriction unless both endpoints are valid, just as shown in the UI.
  if(from && to) {
    const start = from <= to ? from : to, end = to >= from ? to : from;
    result = result.filter(row => row.periodStart <= end && row.periodEnd >= start);
  }
  return result;
}
function metrics(records) {
  const audited=sum(records,'audited'), completed=sum(records,'completed'), pending=sum(records,'pending');
  const byEvent=eventTypes.map(type=>({
    event:type,
    audited:records.reduce((a,r)=>a+(r.eventBreakdown[type]?.examined||0),0),
    completed:records.reduce((a,r)=>a+(r.eventBreakdown[type]?.completed||0),0)
  }));
  return {audited,completed,pending,issues:sum(records,'issues'),rate:audited ? completed/audited:0,
    audits:new Set(records.map(r=>r.id)).size, companies:new Set(records.map(r=>r.company)).size,
    byEvent};
}
function trend(records) {
  const months = new Map();
  for(const r of records) {
    const k=r.periodStart.slice(0,7);
    if(!months.has(k)) months.set(k,{period:k,audited:0,completed:0,issues:0});
    const m=months.get(k);m.audited+=r.audited;m.completed+=r.completed;m.issues+=r.issues;
  }
  return [...months.values()].sort((a,b)=>a.period.localeCompare(b.period)).map(m=>({...m,rate:m.audited?m.completed/m.audited:0}));
}
function issueSummary(records) {
  return issueTypes.map(name=>({name,count:records.filter(r=>r.mainIssue===name).reduce((a,r)=>a+r.issues,0)}))
    .filter(x=>x.count>0).sort((a,b)=>b.count-a.count);
}
function performance(records,byUnit=false) {
  const map=new Map();
  for(const r of records) {
    const key=byUnit ? (r.unit || r.company) : r.company;
    if(!map.has(key)) map.set(key,{name:key,audited:0,completed:0,issues:0});
    const o=map.get(key);o.audited+=r.audited;o.completed+=r.completed;o.issues+=r.issues;
  }
  return [...map.values()].map(v=>({...v,rate:v.audited?v.completed/v.audited:0})).sort((a,b)=>a.rate-b.rate);
}
const treatmentsFor = (records, overrides=new Map())=>records.filter(row=>row.issues>0).map(row=>({
  id:`T-${row.id}`,auditId:row.id,company:row.company,unit:row.unit,periodEnd:row.periodEnd,
  issue:row.mainIssue,quantity:row.issues,
  status:overrides.get(row.id)?.status || (row.treatmentCount>0?'Em análise':'Aguardando retorno'),
  note:overrides.get(row.id)?.note||'',
}));
function csvSafe(value) {
  let str=String(value??'');
  if(/^[=+@\-\t\r]/.test(str)) str="'"+str;
  return `"${str.replace(/"/g,'""')}"`;
}
function toCsv(records) {
  const keys=['id','company','unit','periodStart','periodEnd','audited','completed','pending','issues','mainIssue','status'];
  return [keys.map(csvSafe).join(';'),...records.map(row=>keys.map(k=>csvSafe(row[k])).join(';'))].join('\r\n')+'\r\n';
}
module.exports={withinScope,filterRows,metrics,trend,issueSummary,performance,treatmentsFor,toCsv,safeDate};
