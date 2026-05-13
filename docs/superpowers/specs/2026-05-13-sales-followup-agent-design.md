# Sales Followup Agent Design

## Goal

Build a local, demo-ready sales follow-up Agent for CRM scenarios. The first version uses simulated customer and opportunity data, then applies deterministic rules to generate customer summaries, risk signals, recommended next actions, and a manager daily brief.

## Scope

The app is a single-page web prototype. It does not require login, a backend, a database, or a model API key. The Agent logic must be isolated so it can later be replaced or augmented by an LLM call.

## Core Experience

- Customer list with stage, owner, deal value, probability, last contact date, and risk.
- Selected customer detail panel with recent activity and Agent-generated analysis.
- Recommended next action with suggested channel, timing, priority, and message draft.
- Manager daily brief that highlights at-risk deals, high-value opportunities, and overdue follow-ups.

## Architecture

- `src/data/mockCrm.js` owns simulated CRM records.
- `src/lib/agentEngine.js` owns scoring, risk classification, next-action generation, and daily brief aggregation.
- `src/components/*` owns focused presentational UI pieces.
- `src/App.jsx` coordinates state and passes analyzed data into components.

## Testing And Verification

The Agent engine will have unit tests for risk classification, next-action generation, and daily brief aggregation. The app must pass `npm run build` and run through a local Vite dev server.
