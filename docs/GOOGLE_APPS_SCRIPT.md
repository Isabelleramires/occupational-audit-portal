# Optional Google Apps Script Example

The `apps-script-example/` folder contains a **separate, simplified, independent** Google Apps Script demo. It is not the Node.js backend and does not read any production spreadsheet.

1. Create a new standalone Apps Script project at script.google.com, using your own personal account.
2. Replace the editor's `Code.gs` with the contents of `apps-script-example/Code.gs`.
3. Create an HTML file named `Index` and paste `apps-script-example/Index.html`.
4. Run `getDemoAuditSummary` to grant any necessary initial permissions (the script itself does not request external data).
5. Choose **Deploy → New deployment → Web app**, choose the account and access setting suitable for your own demonstration. Do not use this sample as a real authentication portal.

The example includes fabricated audit totals, a dashboard, date filters, and event breakdowns. It uses Apps Script's `google.script.run` to call server-side functions, without real client data or external integrations.

The more complete portal (including demo profiles, audit details, issues, follow-up status, and CSV export) is executed from the repository root with `npm start`.
