# Evidence-Linked Handover System

WCC Forge 48, Round 2. Problem: Prevent Critical Knowledge From Leaving With People.

Rebuilds a volunteer project's state from exported records, links every claim to a verified
source quote, grades it green / amber / red, lets the team lead review and approve, and shows
the incoming member a permission-aware plan. All data is synthetic.

## Demo logins (password for all: Demo@1234)
- meera@demo.test: Team lead (full access, review, readiness score)
- aarav@demo.test: Leaving member (team-visible items)
- kiran@demo.test: New joiner (approved, non-restricted items only)

## Stack
React, Tailwind, TanStack Query, Zustand (client) | Node.js, Express 5, Zod, JWT (server) | PostgreSQL (Neon)

## Run locally
1. `cd server`, copy `.env.example` to `.env`, fill it in, `npm install`
2. `node src/migrate.js`, `node src/seed.js`, `node src/loadDemo.js`, `node src/runPipeline.js`
3. `npm run dev`
4. In another terminal: `cd client`, `npm install`, `npm run dev`