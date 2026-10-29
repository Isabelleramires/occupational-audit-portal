/**
 * Minimal, independent Google Apps Script example.
 * This is not the backend used by the Node.js demonstration.
 * There are no spreadsheet IDs, integration keys, external URLs or real data.
 */
function doGet() {
  return HtmlService.createHtmlOutput(
    '<main style="font-family:Arial;padding:32px">' +
    '<h1>Occupational Audit Portal — Apps Script example</h1>' +
    '<p>Sample data only. The runnable portal is available in the repository root.</p>' +
    '</main>'
  ).setTitle('Occupational Audit Portal — Example');
}

function getDemoAuditSummary() {
  var demoRows = [
    {company: 'Exemplo Alfa', audited: 40, completed: 35, issues: 3},
    {company: 'Exemplo Beta', audited: 25, completed: 20, issues: 2}
  ];
  var result = demoRows.reduce(function(acc, row) {
    acc.audited += row.audited;
    acc.completed += row.completed;
    acc.issues += row.issues;
    return acc;
  }, {audited: 0, completed: 0, issues: 0});
  result.completionRate = result.audited > 0 ? result.completed / result.audited : 0;
  return result;
}

/**
 * Self-contained Apps Script dashboard with fabricated, aggregated rows.
 * Date range only applies when both date fields are provided.
 */
function getPortalDemoData(profileId, filters) {
  var profiles = {
    'demo-a': 'Organização Exemplo A',
    'demo-b': 'Organização Exemplo B'
  };
  if (!profiles[profileId]) throw new Error('Perfil de demonstração desconhecido.');
  var sample = [];
  var typeList = ['S-2220', 'S-2221', 'S-2240'];
  for (var week = 0; week < 12; week++) {
    for (var eventIndex = 0; eventIndex < typeList.length; eventIndex++) {
      var start = new Date(2026, 5, 1 + week * 7);
      var end = new Date(2026, 5, 7 + week * 7);
      var dateStart = Utilities.formatDate(start, 'America/Sao_Paulo', 'yyyy-MM-dd');
      var dateEnd = Utilities.formatDate(end, 'America/Sao_Paulo', 'yyyy-MM-dd');
      var audited = 16 + (week * 3 + eventIndex * 5 + (profileId === 'demo-b' ? 4 : 0)) % 21;
      var completed = audited - (2 + (week + eventIndex) % 6);
      sample.push({
        id: 'EXEMPLO-' + (week + 1) + '-' + (eventIndex + 1),
        company: profiles[profileId], start: dateStart, end: dateEnd,
        type: typeList[eventIndex], audited: audited, completed: completed
      });
    }
  }
  var from = String(filters && filters.from || '');
  var to = String(filters && filters.to || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    var low = from < to ? from : to;
    var high = from < to ? to : from;
    sample = sample.filter(function(r) { return r.start <= high && r.end >= low; });
  }
  var totals = sample.reduce(function(a, r) {
    a.audited += r.audited; a.completed += r.completed;
    return a;
  }, {audited: 0, completed: 0});
  totals.pending = totals.audited - totals.completed;
  totals.rate = totals.audited ? totals.completed / totals.audited : 0;
  var byEvent = typeList.map(function(type) {
    var eventRows = sample.filter(function(r) { return r.type === type; });
    var total = eventRows.reduce(function(a,r) {return a + r.audited;},0);
    var done = eventRows.reduce(function(a,r) {return a + r.completed;},0);
    return {type:type,rate:total ? done/total : 0};
  });
  return {totals:totals,byEvent:byEvent,rows:sample.slice().reverse()};
}
