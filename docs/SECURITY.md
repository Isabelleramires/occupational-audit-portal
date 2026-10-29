# Public Demo Safety Notes

This repository is designed for public portfolio viewing, with artificial records and no external dependencies.

## Included

- Fictional organization names and deterministic aggregate audit totals
- Local-only profiles that demonstrate separate server-side views
- HTTP-only demo session cookie
- Simulated updates to follow-up status
- CSV export for fictional, in-scope records

## Excluded

- Original company code, brand assets, internal documentation and spreadsheets
- Real client identifiers, employee data, names, CPF/CNPJ, health records, credentials and access codes
- Production domains, integrations, tokens, service endpoints or API keys
- Original audit exports, production dashboards, screenshots and metadata

## Not intended for production

All demo profiles are selectable by any visitor. There is **no actual user authentication** or durable authorization platform. The in-memory session and filtering are used to illustrate application structure only. Do not use this server to store or process confidential data.

If you encounter an unexpected sensitive value, do not open a public issue with that value. Remove the value locally and avoid pushing it to a repository history.

**Rights notice:** Sanitizing data does not itself grant permission to publish a company's proprietary implementation. This repository contains independent example code and should not be mixed with operational sources.
