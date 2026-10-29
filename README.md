# 📊 Occupational Audit Portal

**💼 Professional Context | Independent Demonstration**  
**Client Portal & Audit Analytics Dashboard**  
*A fictional, independently developed portal for exploring occupational eSocial audit workflows.*

![Status](https://img.shields.io/badge/Status-Portfolio%20Demo-6478E5?style=for-the-badge)
![Context](https://img.shields.io/badge/Context-Professional-334C74?style=for-the-badge)
![Data](https://img.shields.io/badge/Data-100%25%20Fictional-1F9277?style=for-the-badge)

---

## 🚀 About the Project

This project was inspired by challenges encountered in a **professional occupational health context**, where multiple organizations needed a clear view of audit progress, outstanding items and operational indicators.

The public repository is an **independently written demonstration**. It does **not** contain operational workplace source code, corporate identity, internal rules, credentials, client information or production integrations. The data and organizations are entirely fabricated.

The original context involved **Google Apps Script, Google Sheets and an embedded web portal**. For easy local execution and code review, this independent demo uses a self-contained **Node.js application**. A separate simplified Google Apps Script example is available in [`apps-script-example/`](apps-script-example/).

> **Demo only:** The selectable profiles do not represent real customers. No real login, external system, medical records or live eSocial API is used.

---

## 🛠️ Technologies & Skills

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Google Apps Script](https://img.shields.io/badge/Apps%20Script-4285F4?style=for-the-badge&logo=google&logoColor=white)

**Concepts:** REST-style APIs · client-facing dashboards · server-side data scoping · aggregate analytics · filters · CSV export · responsive UI · functional and HTTP tests

---

## 📌 Main Features

| Module | Implemented in the Node.js demo |
| --- | --- |
| **Demo client access** | Choose between fictional organization profiles |
| **Overview dashboard** | Audited/completed/pending totals, completion rates and trends |
| **Audit history** | Search, filter and inspect generated audit records |
| **Inconsistency analysis** | Category breakdown and per-audit totals |
| **Follow-up management** | Simulated status and note updates within the current session |
| **Performance** | Compare completion rates across companies or units |
| **Fictional data source** | Review aggregate records and export a CSV file |
| **Scoped API** | Records are filtered by the current demonstration profile on the server |

The dataset contains fictional S-2220, S-2221 and S-2240 event aggregates, not individual employee records. Dates start unfiltered, and the date range applies only when both boundaries are supplied.

---

## ⚙️ Run Locally

**Requirements:** Node.js 20 or later. No database, API key, Google account or npm dependencies are required.

```bash
npm start
```

Open **http://localhost:3000** and select a fictional organization profile. This runs the demo interface and its local API.

Run automated tests:

```bash
npm test
```

If you would like to explore the optional Google Apps Script variant, see [Google Apps Script instructions](docs/GOOGLE_APPS_SCRIPT.md). It is intentionally simpler than the Node.js demo.

---

## 🏗️ Repository Structure

```text
occupational-audit-portal/
├── public/                  Responsive demo interface
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── favicon.svg
├── src/
│   ├── server.js            Local HTTP API and in-memory sessions
│   ├── domain.js            Aggregation, filters and CSV export
│   └── data.js              Deterministic synthetic records
├── apps-script-example/     Standalone simplified Apps Script demo
├── samples/                 Fictional CSV data sample
├── tests/                   Automated domain and HTTP tests
├── docs/                    Architecture, security and execution notes
├── package.json
└── README.md
```

For details, read [Architecture Notes](docs/ARCHITECTURE.md) and [Public Demo Safety Notes](docs/SECURITY.md).

---

## 🔐 Data Privacy & Limitations

- No operational company code or real client/employee records are included.
- There are **no live connections to eSocial, Google Sheets or other corporate systems**.
- Demo profiles are public and **are not a real authentication mechanism**.
- Follow-up changes exist only in the active session's memory.
- All metrics are illustrative, not actual business performance.
- This is a portfolio project, **not a production-ready occupational health system**.

The accompanying [`samples/fictional-audit-base.csv`](samples/fictional-audit-base.csv) is generated from mock data and is safe to use for testing.

---

## 👩‍💻 Author

**Isabelle Ramires** · [GitHub @Isabelleramires](https://github.com/Isabelleramires)

*Independent demonstration of technical concepts explored in a professional context — not an academic assignment or an official operational system.*
