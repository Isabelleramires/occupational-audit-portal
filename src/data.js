/**
 * Independent portfolio demonstration.
 * All organizations, records, metrics, identifiers and dates are synthetic.
 * No production source systems, customer files or external integrations.
 */
const profiles = Object.freeze([
  {id: 'demo-norte', name: 'Organização Norte', initials:'ON', subtitle: 'Visualização por empresa', usesUnits: false, role:'Cliente', companies:['Norte Serviços','Norte Logística']},
  {id: 'demo-sul', name: 'Organização Sul', initials:'OS', subtitle: 'Visualização por empresa e unidade', usesUnits: true, role:'Cliente', companies:['Sul Operações','Sul Tecnologia']},
  {id: 'demo-leste', name: 'Organização Leste', initials:'OL', subtitle: 'Visualização de auditorias', usesUnits: false, role:'Cliente', companies:['Leste Soluções']}
]);

const issueTypes = Object.freeze([
  'Cadastro incompleto',
  'Dados divergentes',
  'Informação não localizada',
  'Registro aguardando validação',
  'Documentação pendente'
]);
const eventTypes = Object.freeze(['S-2220','S-2221','S-2240']);
const periods = [
  ['2026-04-06','2026-04-12'],['2026-04-13','2026-04-19'],['2026-04-20','2026-04-26'],['2026-04-27','2026-05-03'],
  ['2026-05-04','2026-05-10'],['2026-05-11','2026-05-17'],['2026-05-18','2026-05-24'],['2026-05-25','2026-05-31'],
  ['2026-06-01','2026-06-07'],['2026-06-08','2026-06-14'],['2026-06-15','2026-06-21'],['2026-06-22','2026-06-28'],
  ['2026-06-29','2026-07-05'],['2026-07-06','2026-07-12'],['2026-07-13','2026-07-19'],['2026-07-20','2026-07-26'],
  ['2026-07-27','2026-08-02'],['2026-08-03','2026-08-09'],['2026-08-10','2026-08-16'],['2026-08-17','2026-08-23'],
  ['2026-08-24','2026-08-30'],['2026-08-31','2026-09-06'],['2026-09-07','2026-09-13'],['2026-09-14','2026-09-20'],
  ['2026-09-21','2026-09-27'],['2026-09-28','2026-10-04'],['2026-10-05','2026-10-11'],['2026-10-12','2026-10-18'],
  ['2026-10-19','2026-10-25'],['2026-10-26','2026-11-01']
];
function seeded(x) {
  let state = x >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function generateRows() {
  const random = seeded(20261029);
  const output = [];
  profiles.forEach((profile, profileIndex) => {
    periods.forEach(([start,end], periodIndex) => {
      profile.companies.forEach((company, companyIndex) => {
        const units = profile.usesUnits ? (companyIndex === 0 ? ['Unidade Centro','Unidade Norte'] : ['Unidade Principal']) : [''];
        units.forEach((unit, unitIndex) => {
          const id = `DEMO-${String(profileIndex+1).padStart(2,'0')}-${String(periodIndex+1).padStart(2,'0')}-${companyIndex+1}${unitIndex+1}`;
          const byEvent = Object.fromEntries(eventTypes.map((event, eventIndex) => {
            const examined = 4 + Math.floor(random()*16) + (eventIndex===0 ? 11 : 0);
            const completed = Math.max(0, examined - (1 + Math.floor(random()*5)));
            return [event, {examined, completed, pending: examined-completed}];
          }));
          const audited = Object.values(byEvent).reduce((sum,e) => sum+e.examined,0);
          const completed = Object.values(byEvent).reduce((sum,e) => sum+e.completed,0);
          const pending = audited-completed;
          const issues = Math.min(pending, Math.floor(random()*8)+1);
          const issue = issueTypes[(profileIndex*9 + periodIndex + companyIndex + unitIndex)%issueTypes.length];
          const treatments = Math.min(issues,Math.floor(random()*4));
          output.push({
            id, tenantId: profile.id, company, unit, periodStart:start, periodEnd:end,
            audited, completed, pending, issues, treatmentCount:treatments, eventBreakdown:byEvent,
            mainIssue:issue,
            lastUpdate: `${end}T17:15:00.000Z`,
            status: pending === 0 ? 'Concluída' : issues >= 5 ? 'Atenção' : 'Em acompanhamento'
          });
        });
      });
    });
  });
  return Object.freeze(output.map(row => Object.freeze(row)));
}
const rows = generateRows();
module.exports = {profiles, rows, eventTypes, issueTypes};
