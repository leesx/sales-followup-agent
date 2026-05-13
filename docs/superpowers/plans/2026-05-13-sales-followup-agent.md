# Sales Followup Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local sales follow-up Agent MVP with simulated CRM data, rule-based analysis, and a polished operational UI.

**Architecture:** Use a Vite React app. Keep CRM mock data separate from the Agent engine, and keep UI components presentational so the analysis layer can later call a real model or backend.

**Tech Stack:** Vite, React, JavaScript, Vitest, CSS.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/styles.css`

- [ ] Create a Vite React project shell with scripts for `dev`, `build`, `preview`, and `test`.
- [ ] Add a minimal React entry point and app root.
- [ ] Add base CSS variables and layout reset.
- [ ] Run `npm install`.

### Task 2: Agent Engine And Tests

**Files:**
- Create: `src/data/mockCrm.js`
- Create: `src/lib/agentEngine.js`
- Create: `src/lib/agentEngine.test.js`

- [ ] Create six realistic simulated customers with varied deal stages, values, contact ages, pain points, and activity history.
- [ ] Implement `analyzeCustomer`, `analyzeCustomers`, and `buildManagerBrief`.
- [ ] Add Vitest coverage for high-risk overdue deals, next-action drafts, and daily brief counts.
- [ ] Run `npm test -- --run`.

### Task 3: Interface Components

**Files:**
- Create: `src/components/CustomerList.jsx`
- Create: `src/components/CustomerProfile.jsx`
- Create: `src/components/InsightPanel.jsx`
- Create: `src/components/ManagerBrief.jsx`
- Modify: `src/App.jsx`

- [ ] Render analyzed customers in a selectable list.
- [ ] Render selected customer profile and activity timeline.
- [ ] Render Agent summary, risk reasons, recommended action, and message draft.
- [ ] Render manager brief metrics and priority queue.

### Task 4: Styling And Verification

**Files:**
- Modify: `src/styles.css`

- [ ] Style the app as a dense SaaS operations interface rather than a landing page.
- [ ] Ensure desktop and mobile layouts remain readable.
- [ ] Run `npm run build`.
- [ ] Start Vite and verify the local app opens.
